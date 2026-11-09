import { describe, expect, it, vi } from 'vitest';

vi.mock('./db', () => ({ exportLibrary: vi.fn(), getSettings: vi.fn(), updateSettings: vi.fn() }));
vi.mock('./utils', () => ({ buildExportFilename: () => 'backup.json', downloadJson: vi.fn() }));

import { exportLibrary, updateSettings } from './db';
import { downloadJson } from './utils';
import { BACKUP_INTERVAL_MS, isBackupReminderDue, saveLibraryBackup } from './backup-reminders';

const settings = { backupRemindersEnabled: true, lastBackupAt: null, backupReminderSnoozedUntil: null };

describe('backup reminders', () => {
	it('reminds users without a recorded backup', () => {
		expect(isBackupReminderDue(settings)).toBe(true);
	});
	it('waits 30 days after a backup', () => {
		const backedUp = { ...settings, lastBackupAt: 1000 };
		expect(isBackupReminderDue(backedUp, 1000 + BACKUP_INTERVAL_MS - 1)).toBe(false);
		expect(isBackupReminderDue(backedUp, 1000 + BACKUP_INTERVAL_MS)).toBe(true);
	});
	it('respects disabled reminders and snoozes', () => {
		expect(isBackupReminderDue({ ...settings, backupRemindersEnabled: false })).toBe(false);
		const snoozed = { ...settings, backupReminderSnoozedUntil: 2000 };
		expect(isBackupReminderDue(snoozed, 1999)).toBe(false);
		expect(isBackupReminderDue(snoozed, 2000)).toBe(true);
	});
	it('records full backups only after initiating the download', async () => {
		vi.mocked(updateSettings).mockClear();
		await saveLibraryBackup();
		expect(downloadJson).toHaveBeenCalled();
		expect(updateSettings).toHaveBeenCalledWith({ lastBackupAt: expect.any(Number), backupReminderSnoozedUntil: null });
		vi.mocked(updateSettings).mockClear();
		vi.mocked(exportLibrary).mockRejectedValueOnce(new Error('Export failed'));
		await expect(saveLibraryBackup()).rejects.toThrow('Export failed');
		expect(updateSettings).not.toHaveBeenCalled();
	});
});
