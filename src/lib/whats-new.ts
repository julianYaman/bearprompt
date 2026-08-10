import type { Settings } from './types';
import { updateSettings } from './db';

/** Stable id for the single active What's New Highlight. Change this when shipping the next highlight. */
export const CURRENT_WHATS_NEW_ID = 'desktop-agent-providers';

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
	title: 'Open prompts in Cursor, Claude Code, and ChatGPT Desktop',
	body: 'Desktop coding agents are now built into Open in…. Cursor, Claude Code, and ChatGPT (Desktop) open locally with your prompt pre-filled — you confirm before anything runs. Hide any tool you do not use under Settings → AI Tools.',
	ctaLabel: 'Open AI Tools settings',
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
