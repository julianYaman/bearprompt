<script lang="ts">
	import { onMount } from 'svelte';
	import { prompts } from '$lib/stores';
	import {
		backupReminderSettings, loadBackupReminderSettings, isBackupReminderDue,
		setBackupReminderSettings, saveLibraryBackup, BACKUP_SNOOZE_MS
	} from '$lib/backup-reminders';

	let now = $state(Date.now());
	let busy = $state(false);
	let error = $state('');
	let due = $derived($prompts.length > 0 && $backupReminderSettings !== null && isBackupReminderDue($backupReminderSettings, now));

	onMount(() => {
		void loadBackupReminderSettings().catch((error) => console.error('Could not load backup reminder:', error));
		const timer = setInterval(() => { now = Date.now(); }, 60_000);
		return () => clearInterval(timer);
	});

	async function act(action: 'backup' | 'snooze') {
		busy = true;
		error = '';
		try {
			if (action === 'backup') await saveLibraryBackup();
			else await setBackupReminderSettings({ backupReminderSnoozedUntil: Date.now() + BACKUP_SNOOZE_MS });
		} catch {
			error = 'Could not complete this action. Please try again.';
		} finally {
			busy = false;
		}
	}
</script>

{#if due}
	<aside aria-label="Library backup reminder" class="mb-4 rounded-xl border p-4" style="border-color: var(--color-border); background: var(--color-bg-secondary); color: var(--color-text-primary);">
		<p class="font-semibold">Keep a backup of your library</p>
		<p class="mt-1 text-sm" style="color: var(--color-text-secondary);">Your library is stored in this browser. Download a full backup regularly so you can restore it if browser data is cleared. Keep the downloaded file somewhere safe.</p>
		<div class="mt-3 flex flex-wrap items-center gap-4 text-sm">
			<button type="button" disabled={busy} onclick={() => act('backup')} class="cursor-pointer rounded-lg px-3 py-2 font-medium disabled:cursor-not-allowed disabled:opacity-50" style="background: var(--color-accent); color: white;">Back up now</button>
			<button type="button" disabled={busy} onclick={() => act('snooze')} class="cursor-pointer underline disabled:cursor-not-allowed disabled:opacity-50">Remind me in 7 days</button>
			<a href="/settings#backups" class="cursor-pointer underline">Reminder settings</a>
		</div>
		{#if error}<p role="alert" class="mt-2 text-sm">{error}</p>{/if}
	</aside>
{/if}
