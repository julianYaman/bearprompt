import {
	NEW_PROMPT_HASH_PREFIX,
	NEW_PROMPT_SESSION_STORAGE_KEY,
	SHARE_HASH_PREFIX,
	SHARE_SESSION_STORAGE_KEY,
	parseShareHash
} from './share';

export function isSensitiveUrlHash(hash: string): boolean {
	return hash.startsWith(SHARE_HASH_PREFIX) || hash.startsWith(NEW_PROMPT_HASH_PREFIX);
}

export function persistSensitiveUrlHash(
	hash: string,
	storage?: Pick<Storage, 'setItem'>
): boolean {
	if (!isSensitiveUrlHash(hash)) return false;

	try {
		const store = storage ?? sessionStorage;
		if (hash.startsWith(SHARE_HASH_PREFIX)) {
			const shareRef = parseShareHash(hash);
			if (shareRef) {
				store.setItem(SHARE_SESSION_STORAGE_KEY, JSON.stringify(shareRef));
			}
			return true;
		}

		store.setItem(NEW_PROMPT_SESSION_STORAGE_KEY, hash);
		return true;
	} catch {
		return true;
	}
}

export function stripSensitiveHashFromUrl(href: string, base = 'https://bearprompt.com'): string {
	const url = new URL(href, base);
	if (!isSensitiveUrlHash(url.hash)) return url.href;
	url.hash = '';
	return url.href;
}

export function sanitizeHistoryUrl(
	url: string | URL | null | undefined,
	currentHref: string
): string | URL | null | undefined {
	const resolvedHref = url == null || url === '' ? currentHref : new URL(String(url), currentHref).href;
	const resolved = new URL(resolvedHref);
	if (!persistSensitiveUrlHash(resolved.hash)) return url;

	resolved.hash = '';
	return `${resolved.pathname}${resolved.search}`;
}

export function persistAndStripSensitiveLocationHash(): void {
	if (typeof window === 'undefined') return;
	if (!persistSensitiveUrlHash(window.location.hash)) return;
	history.replaceState(null, '', window.location.pathname + window.location.search);
}

export function installSensitiveHashGuard(): void {
	if (typeof window === 'undefined' || window.__bearpromptSensitiveHashGuard) return;
	window.__bearpromptSensitiveHashGuard = true;

	const wrap = (method: 'pushState' | 'replaceState') => {
		const original = history[method].bind(history);
		history[method] = ((data: unknown, unused: string, url?: string | URL | null) => {
			return original(data, unused, sanitizeHistoryUrl(url, window.location.href));
		}) as History[typeof method];
	};

	wrap('pushState');
	wrap('replaceState');
	persistAndStripSensitiveLocationHash();
	window.addEventListener('hashchange', persistAndStripSensitiveLocationHash);
}
