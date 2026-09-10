/**
 * Runs before Vemetric. Keep prefixes/keys in sync with src/lib/share.ts.
 * Encrypted share keys and prefilled prompt payloads must never appear in analytics URLs.
 */
(() => {
	const SHARE_PREFIX = '#share=';
	const NEW_PREFIX = '#new=';
	const SHARE_KEY = '__bearprompt_share_ref_v1';
	const NEW_KEY = '__bearprompt_new_prompt_ref_v1';

	function isSensitive(hash) {
		return hash.startsWith(SHARE_PREFIX) || hash.startsWith(NEW_PREFIX);
	}

	function persistHash(hash) {
		if (!isSensitive(hash)) return false;
		try {
			if (hash.startsWith(SHARE_PREFIX)) {
				const value = hash.slice(SHARE_PREFIX.length);
				const separatorIndex = value.indexOf(':');
				if (separatorIndex > 0) {
					const id = decodeURIComponent(value.slice(0, separatorIndex)).trim();
					const key = decodeURIComponent(value.slice(separatorIndex + 1)).trim();
					if (id && key) {
						sessionStorage.setItem(SHARE_KEY, JSON.stringify({ id, key }));
					}
				}
			} else {
				sessionStorage.setItem(NEW_KEY, hash);
			}
		} catch {
			// Ignore malformed hashes or storage failures; still strip below.
		}
		return true;
	}

	function sanitizeHistoryUrl(url) {
		const currentHref = window.location.href;
		const resolvedHref =
			url == null || url === '' ? currentHref : new URL(String(url), currentHref).href;
		const resolved = new URL(resolvedHref);
		if (!persistHash(resolved.hash)) return url;
		resolved.hash = '';
		return resolved.pathname + resolved.search;
	}

	const nativePush = History.prototype.pushState;
	const nativeReplace = History.prototype.replaceState;

	History.prototype.pushState = function (state, title, url) {
		return nativePush.call(this, state, title, sanitizeHistoryUrl(url));
	};
	History.prototype.replaceState = function (state, title, url) {
		return nativeReplace.call(this, state, title, sanitizeHistoryUrl(url));
	};

	if (persistHash(window.location.hash)) {
		nativeReplace.call(history, null, '', window.location.pathname + window.location.search);
	}

	window.addEventListener('hashchange', () => {
		if (!persistHash(window.location.hash)) return;
		nativeReplace.call(history, null, '', window.location.pathname + window.location.search);
	});
})();
