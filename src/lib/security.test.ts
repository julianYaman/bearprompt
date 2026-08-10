import { describe, expect, it } from 'vitest';
import { sanitizeExternalUrl, sanitizeProviderUrl } from './security';

describe('sanitizeExternalUrl', () => {
	it('allows only http and https', () => {
		expect(sanitizeExternalUrl('https://example.com')).toBe('https://example.com/');
		expect(sanitizeExternalUrl('http://example.com/path')).toBe('http://example.com/path');
		expect(sanitizeExternalUrl('cursor://anysphere.cursor-deeplink/prompt?text=hi')).toBeNull();
		expect(sanitizeExternalUrl('javascript:alert(1)')).toBeNull();
	});
});

describe('sanitizeProviderUrl', () => {
	it('allows web and desktop agent schemes', () => {
		expect(sanitizeProviderUrl('https://chat.openai.com/?q=hi')).toBe(
			'https://chat.openai.com/?q=hi'
		);
		expect(
			sanitizeProviderUrl('cursor://anysphere.cursor-deeplink/prompt?text=hello%20world')
		).toContain('cursor://');
		expect(sanitizeProviderUrl('claude-cli://open?q=hi')).toContain('claude-cli:');
		expect(sanitizeProviderUrl('codex://new?prompt=hi')).toContain('codex:');
	});

	it('rejects unsafe schemes', () => {
		expect(sanitizeProviderUrl('javascript:alert(1)')).toBeNull();
		expect(sanitizeProviderUrl('file:///etc/passwd')).toBeNull();
		expect(sanitizeProviderUrl('data:text/html,hi')).toBeNull();
	});
});
