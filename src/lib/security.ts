export function serializeJsonLd(value: unknown): string {
	return JSON.stringify(value)
		.replace(/</g, '\\u003c')
		.replace(/>/g, '\\u003e')
		.replace(/&/g, '\\u0026')
		.replace(/\u2028/g, '\\u2028')
		.replace(/\u2029/g, '\\u2029');
}

export function sanitizeExternalUrl(input: unknown): string | null {
	if (typeof input !== 'string') return null;
	const value = input.trim();
	if (!value) return null;

	try {
		const url = new URL(value);
		if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
		return url.toString();
	} catch {
		return null;
	}
}

/** Schemes allowed for AI provider URL templates (web chats + desktop deep links). */
export const ALLOWED_PROVIDER_SCHEMES = [
	'http:',
	'https:',
	'cursor:',
	'claude-cli:',
	'codex:'
] as const;

export type AllowedProviderScheme = (typeof ALLOWED_PROVIDER_SCHEMES)[number];

const ALLOWED_PROVIDER_SCHEME_SET = new Set<string>(ALLOWED_PROVIDER_SCHEMES);

/**
 * Validates a provider open URL. Unlike sanitizeExternalUrl, this allows
 * desktop deep-link schemes used by Cursor, Claude Code, and ChatGPT Desktop.
 */
export function sanitizeProviderUrl(input: unknown): string | null {
	if (typeof input !== 'string') return null;
	const value = input.trim();
	if (!value) return null;

	try {
		const url = new URL(value);
		if (!ALLOWED_PROVIDER_SCHEME_SET.has(url.protocol)) return null;
		return url.toString();
	} catch {
		return null;
	}
}
