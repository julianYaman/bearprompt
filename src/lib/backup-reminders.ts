import { writable } from 'svelte/store';
import { exportLibrary, getSettings, updateSettings } from './db';
import { buildExportFilename, downloadJson } from './utils';
import type { Settings } from './types';

type BackupSettings = Pick<Settings, 'backupRemindersEnabled' | 'lastBackupAt' | 'backupReminderSnoozedUntil'>;
export const BACKUP_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000;
export const BACKUP_SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;
export const backupReminderSettings = writable<BackupSettings | null>(null);

export function isBackupReminderDue(settings: BackupSettings, now = Date.now()): boolean {
	return settings.backupRemindersEnabled
		&& (settings.backupReminderSnoozedUntil === null || now >= settings.backupReminderSnoozedUntil)
		&& (settings.lastBackupAt === null || now - settings.lastBackupAt >= BACKUP_INTERVAL_MS);
}

export async function loadBackupReminderSettings(): Promise<void> {
	backupReminderSettings.set(await getSettings());
}

export async function setBackupReminderSettings(updates: Partial<BackupSettings>): Promise<void> {
	backupReminderSettings.set(await updateSettings(updates));
}

export async function saveLibraryBackup(): Promise<void> {
	const data = await exportLibrary();
	downloadJson(data, buildExportFilename());
	// Browsers expose download initiation, not whether the user kept the file.
	await setBackupReminderSettings({ lastBackupAt: Date.now(), backupReminderSnoozedUntil: null });
}
