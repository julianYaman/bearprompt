import { describe, expect, it } from 'vitest';
import {
	announcementAppliesToPath,
	isAnnouncementActive,
	isHttpAnnouncementHref,
	readSeenAnnouncementId,
	sanitizeAnnouncementHref,
	SEEN_ANNOUNCEMENT_STORAGE_KEY,
	writeSeenAnnouncementId,
	type Announcement
} from './announcement';

function announcement(overrides: Partial<Announcement> = {}): Announcement {
	return {
		id: 'gpt-6-pack',
		enabled: true,
		message: 'GPT-6 prompts are in the public library',
		href: '/prompts/category/gpt-6',
		cta_label: null,
		ends_at: null,
		...overrides
	};
}

describe('announcementAppliesToPath', () => {
	it('shows on landing, public prompts, and public agents', () => {
		expect(announcementAppliesToPath('/')).toBe(true);
		expect(announcementAppliesToPath('/prompts')).toBe(true);
		expect(announcementAppliesToPath('/prompts/openai/rewrite')).toBe(true);
		expect(announcementAppliesToPath('/agents')).toBe(true);
		expect(announcementAppliesToPath('/agents/openai')).toBe(true);
	});

	it('hides on private and marketing reading surfaces', () => {
		expect(announcementAppliesToPath('/library')).toBe(false);
		expect(announcementAppliesToPath('/blog')).toBe(false);
		expect(announcementAppliesToPath('/blog/prompt-variables')).toBe(false);
		expect(announcementAppliesToPath('/settings')).toBe(false);
		expect(announcementAppliesToPath('/help')).toBe(false);
		expect(announcementAppliesToPath('/about/terms')).toBe(false);
	});
});

describe('isAnnouncementActive', () => {
	const now = new Date('2026-10-06T12:00:00.000Z');

	it('requires enabled and a message', () => {
		expect(isAnnouncementActive(announcement(), now)).toBe(true);
		expect(isAnnouncementActive(announcement({ enabled: false }), now)).toBe(false);
		expect(isAnnouncementActive(announcement({ message: '   ' }), now)).toBe(false);
	});

	it('hides after ends_at', () => {
		expect(
			isAnnouncementActive(announcement({ ends_at: '2026-10-06T11:00:00.000Z' }), now)
		).toBe(false);
		expect(
			isAnnouncementActive(announcement({ ends_at: '2026-10-06T13:00:00.000Z' }), now)
		).toBe(true);
	});
});

describe('sanitizeAnnouncementHref', () => {
	it('allows in-app paths and http(s) URLs', () => {
		expect(sanitizeAnnouncementHref('/prompts/category/gpt-6')).toBe('/prompts/category/gpt-6');
		expect(sanitizeAnnouncementHref('https://bearprompt.com/blog')).toBe(
			'https://bearprompt.com/blog'
		);
	});

	it('rejects unsafe hrefs', () => {
		expect(sanitizeAnnouncementHref('javascript:alert(1)')).toBeNull();
		expect(sanitizeAnnouncementHref('//evil.example')).toBeNull();
		expect(sanitizeAnnouncementHref('')).toBeNull();
	});

	it('treats only http(s) hrefs as external', () => {
		expect(isHttpAnnouncementHref('/prompts')).toBe(false);
		expect(isHttpAnnouncementHref('https://bearprompt.com/blog')).toBe(true);
	});
});

describe('seen announcement storage', () => {
	it('reads and writes the campaign id', () => {
		const store = new Map<string, string>();
		const storage = {
			getItem: (key: string) => store.get(key) ?? null,
			setItem: (key: string, value: string) => {
				store.set(key, value);
			}
		};

		expect(readSeenAnnouncementId(storage)).toBeNull();
		writeSeenAnnouncementId(storage, 'gpt-6-pack');
		expect(store.get(SEEN_ANNOUNCEMENT_STORAGE_KEY)).toBe('gpt-6-pack');
		expect(readSeenAnnouncementId(storage)).toBe('gpt-6-pack');
	});
});
