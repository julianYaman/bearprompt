import { describe, expect, it } from 'vitest';
import { NEW_PROMPT_SESSION_STORAGE_KEY, SHARE_SESSION_STORAGE_KEY } from './share';
import {
	isSensitiveUrlHash,
	persistSensitiveUrlHash,
	sanitizeHistoryUrl,
	stripSensitiveHashFromUrl
} from './sensitive-url-hash';

describe('isSensitiveUrlHash', () => {
	it('treats encrypted share and prefilled prompt hashes as sensitive', () => {
		expect(isSensitiveUrlHash('#share=abc:secret-key')).toBe(true);
		expect(isSensitiveUrlHash('#new=eyJ2IjoxfQ')).toBe(true);
	});

	it('leaves harmless in-app hashes alone', () => {
		expect(isSensitiveUrlHash('#ai-tools')).toBe(false);
		expect(isSensitiveUrlHash('')).toBe(false);
	});
});

describe('stripSensitiveHashFromUrl', () => {
	it('removes share decryption keys from the URL', () => {
		expect(stripSensitiveHashFromUrl('https://bearprompt.com/library#share=share-id:secret-key')).toBe(
			'https://bearprompt.com/library'
		);
	});

	it('removes prefilled prompt payloads from the URL', () => {
		expect(
			stripSensitiveHashFromUrl(
				'https://bearprompt.com/library#new=eyJ2IjoxLCJ0aXRsZSI6IlByaXZhdGUgcHJvbXB0In0'
			)
		).toBe('https://bearprompt.com/library');
	});

	it('keeps query strings and non-sensitive hashes', () => {
		expect(stripSensitiveHashFromUrl('https://bearprompt.com/library?tab=all#ai-tools')).toBe(
			'https://bearprompt.com/library?tab=all#ai-tools'
		);
	});
});

describe('persistSensitiveUrlHash', () => {
	it('stores a parsed share reference without the raw hash', () => {
		const storage = new Map<string, string>();
		persistSensitiveUrlHash('#share=share-id:secret-key', {
			setItem(key, value) {
				storage.set(key, value);
			}
		});

		expect(storage.get(SHARE_SESSION_STORAGE_KEY)).toBe(
			JSON.stringify({ id: 'share-id', key: 'secret-key' })
		);
	});

	it('stores a prefilled prompt hash for the library to consume', () => {
		const storage = new Map<string, string>();
		const hash = '#new=eyJ2IjoxfQ';
		persistSensitiveUrlHash(hash, {
			setItem(key, value) {
				storage.set(key, value);
			}
		});

		expect(storage.get(NEW_PROMPT_SESSION_STORAGE_KEY)).toBe(hash);
	});
});

describe('sanitizeHistoryUrl', () => {
	it('strips sensitive hashes from history URL arguments', () => {
		expect(
			sanitizeHistoryUrl('/library#share=share-id:secret-key', 'https://bearprompt.com/blog')
		).toBe('/library');
		expect(sanitizeHistoryUrl('/settings#ai-tools', 'https://bearprompt.com/library')).toBe(
			'/settings#ai-tools'
		);
	});

	it('strips a sensitive hash from the current location when no URL is passed', () => {
		expect(
			sanitizeHistoryUrl(null, 'https://bearprompt.com/library#share=share-id:secret-key')
		).toBe('/library');
	});
});
