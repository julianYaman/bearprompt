import type { Settings } from './types';
import { updateSettings } from './db';

/** Stable id for the single active What's New Highlight. Change this when shipping the next highlight. */
export const CURRENT_WHATS_NEW_ID = 'custom-ai-providers';

export interface WhatsNewHighlight {
	id: string;
	title: string;
	body: string;
	ctaLabel: string;
	ctaHref: string;
	secondaryLabel: string;
	secondaryHref: string;
}

export const CURRENT_WHATS_NEW: WhatsNewHighlight = {
	id: CURRENT_WHATS_NEW_ID,
	title: 'Open prompts in any chat tool',
	body: 'Add your own AI chat apps under Settings → AI Tools. If a tool accepts a prompt in a URL, Bearprompt can open it with one click — same as ChatGPT, Claude, and the other built-ins. Everything stays on this device.',
	ctaLabel: 'Set up in Settings',
	ctaHref: '/settings#ai-tools',
	secondaryLabel: 'Read the guide',
	secondaryHref: '/blog/custom-ai-providers'
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
