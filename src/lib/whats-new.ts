import type { Settings } from './types';
import { updateSettings } from './db';

/**
 * Stable id for the current What's New release (all points in the modal).
 * Bump this when shipping a new batch of highlights.
 */
export const CURRENT_WHATS_NEW_ID = 'decision-library';

export interface WhatsNewItem {
	title: string;
	body: string;
	icon?: 'sparkles' | 'square-check' | 'folder';
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
			title: 'Decision Library',
			icon: 'sparkles',
			body: 'Browse vendor usage examples for decision models — Liquid d1-ultra and TypeSafe Jev. Each example is typed questions about some state, not a prompt.',
			guideLabel: 'Read the d1-ultra guide',
			guideHref: '/blog/decision-specs-to-use-d1-ultra'
		},
		{
			title: 'Copy runnable Python, TypeScript, or JSON',
			icon: 'square-check',
			body: 'Open an example to copy a call for noul, choice, and score questions, plus a worked example from the vendor docs.'
		}
	],
	ctaLabel: 'Open Decision Library',
	ctaHref: '/decisions'
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
