import type { Settings } from './types';
import { updateSettings } from './db';

/**
 * Stable id for the current What's New release (all points in the modal).
 * Bump this when shipping a new batch of highlights.
 */
export const CURRENT_WHATS_NEW_ID = 'folder-import-export';

export interface WhatsNewItem {
	title: string;
	body: string;
	/** Optional guide link under this point. */
	guideLabel?: string;
	guideHref?: string;
}

export interface WhatsNewRelease {
	id: string;
	/** Newest first — rendered top to bottom in the modal. */
	items: WhatsNewItem[];
	ctaLabel: string;
	ctaHref: string;
}

export const CURRENT_WHATS_NEW: WhatsNewRelease = {
	id: CURRENT_WHATS_NEW_ID,
	items: [
		{
			title: 'Export a folder as a JSON file',
			body: 'Open a folder and choose Export folder, or use the download icon in the sidebar. The file includes that folder, its prompts, and the tags they use — ready to send to someone else.'
		},
		{
			title: 'Import a folder without mixing libraries',
			body: 'Under My Library, choose Import Folder and pick a folder export. Bearprompt always creates a new folder, so nothing merges into what you already have.',
			guideLabel: 'Read the guide',
			guideHref: '/blog/import-export-folders'
		}
	],
	ctaLabel: 'Open My Library',
	ctaHref: '/library'
};

export function shouldAutoShowWhatsNew(settings: Settings): boolean {
	return (
		settings.hasCompletedOnboarding && settings.lastSeenWhatsNewId !== CURRENT_WHATS_NEW_ID
	);
}

export async function markWhatsNewSeen(): Promise<void> {
	await updateSettings({ lastSeenWhatsNewId: CURRENT_WHATS_NEW_ID });
}

export function trackWhatsNewEvent(event: 'Whats New View' | 'Whats New CTA' | 'Whats New Dismiss') {
	const track = (
		window as Window & { vmtrc?: (command: string, name: string) => void }
	).vmtrc;
	void track?.('trackEvent', event);
}
