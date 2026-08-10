import type { Settings } from './types';
import { updateSettings } from './db';

/**
 * Stable id for the current What's New release (all points in the modal).
 * Bump this when shipping a new batch of highlights.
 */
export const CURRENT_WHATS_NEW_ID = 'desktop-agent-providers';

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
			title: 'Open prompts in Cursor, Claude Code, and ChatGPT Desktop',
			body: 'Three desktop agents are built into Open in… and enabled by default. They open locally with your prompt pre-filled. Hide any you do not use under Settings → AI Tools.'
		},
		{
			title: 'Open prompts in any chat tool',
			body: 'Add your own AI apps under Settings → AI Tools. If a tool accepts a prompt in a URL, Bearprompt can open it with one click — same as ChatGPT, Claude, and the other built-ins. Everything stays on this device.',
			guideLabel: 'Read the guide',
			guideHref: '/blog/custom-ai-providers'
		}
	],
	ctaLabel: 'Open AI Tools settings',
	ctaHref: '/settings#ai-tools'
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
	const umami = (
		window as Window & { umami?: { track?: (name: string) => void } }
	).umami;
	umami?.track?.(event);
}
