import { describe, expect, it } from 'vitest';
import { CURRENT_WHATS_NEW_ID, shouldAutoShowWhatsNew } from './whats-new';
import type { Settings } from './types';

function settings(overrides: Partial<Settings> = {}): Settings {
	return {
		version: 1,
		theme: 'system',
		hasCompletedOnboarding: true,
		lastSeenWhatsNewId: null,
		ui: { cardSize: 'm' },
		aiProviders: [],
		...overrides
	};
}

describe('shouldAutoShowWhatsNew', () => {
	it('shows when onboarding is done and highlight is unseen', () => {
		expect(shouldAutoShowWhatsNew(settings())).toBe(true);
	});

	it('hides when onboarding is incomplete', () => {
		expect(shouldAutoShowWhatsNew(settings({ hasCompletedOnboarding: false }))).toBe(false);
	});

	it('hides when the current highlight was already seen', () => {
		expect(
			shouldAutoShowWhatsNew(settings({ lastSeenWhatsNewId: CURRENT_WHATS_NEW_ID }))
		).toBe(false);
	});

	it('shows again when a different highlight id is current', () => {
		expect(shouldAutoShowWhatsNew(settings({ lastSeenWhatsNewId: 'custom-ai-providers' }))).toBe(
			true
		);
	});
});
