import { sanitizeExternalUrl } from './security';

export const SEEN_ANNOUNCEMENT_STORAGE_KEY = 'bearprompt:seen-announcement-id';

export interface Announcement {
	id: string;
	enabled: boolean;
	message: string;
	href: string | null;
	cta_label: string | null;
	ends_at: string | null;
}

export function announcementAppliesToPath(pathname: string): boolean {
	if (pathname === '/') return true;
	if (pathname === '/prompts' || pathname.startsWith('/prompts/')) return true;
	if (pathname === '/agents' || pathname.startsWith('/agents/')) return true;
	return false;
}

export function isAnnouncementActive(
	announcement: Announcement,
	now: Date = new Date()
): boolean {
	if (!announcement.enabled) return false;
	if (!announcement.message.trim()) return false;
	if (announcement.ends_at) {
		const ends = new Date(announcement.ends_at);
		if (!Number.isNaN(ends.getTime()) && ends.getTime() <= now.getTime()) return false;
	}
	return true;
}

export function sanitizeAnnouncementHref(input: unknown): string | null {
	if (typeof input !== 'string') return null;
	const value = input.trim();
	if (!value) return null;

	if (value.startsWith('/') && !value.startsWith('//')) {
		if (value.includes('\\') || /^\/[a-z][a-z0-9+.-]*:/i.test(value)) return null;
		return value;
	}

	return sanitizeExternalUrl(value);
}

export function isHttpAnnouncementHref(href: string): boolean {
	return /^https?:\/\//i.test(href);
}

export function readSeenAnnouncementId(storage: Pick<Storage, 'getItem'>): string | null {
	try {
		return storage.getItem(SEEN_ANNOUNCEMENT_STORAGE_KEY);
	} catch {
		return null;
	}
}

export function writeSeenAnnouncementId(
	storage: Pick<Storage, 'setItem'>,
	id: string
): void {
	try {
		storage.setItem(SEEN_ANNOUNCEMENT_STORAGE_KEY, id);
	} catch {
		// Ignore quota / private-mode failures; the bar can be dismissed for this page load only.
	}
}
