import { describe, expect, it } from 'vitest';
import { isPrivateIpAddress, parsePublicHttpUrl } from './ssrf';

describe('isPrivateIpAddress', () => {
	it('blocks loopback, rfc1918, link-local, and cgnat', () => {
		expect(isPrivateIpAddress('127.0.0.1')).toBe(true);
		expect(isPrivateIpAddress('10.0.0.1')).toBe(true);
		expect(isPrivateIpAddress('192.168.1.1')).toBe(true);
		expect(isPrivateIpAddress('172.16.0.1')).toBe(true);
		expect(isPrivateIpAddress('169.254.169.254')).toBe(true);
		expect(isPrivateIpAddress('100.64.0.1')).toBe(true);
		expect(isPrivateIpAddress('0.0.0.0')).toBe(true);
		expect(isPrivateIpAddress('::1')).toBe(true);
		expect(isPrivateIpAddress('fd12:3456::1')).toBe(true);
		expect(isPrivateIpAddress('fe80::1')).toBe(true);
		expect(isPrivateIpAddress('::ffff:127.0.0.1')).toBe(true);
	});

	it('allows public addresses', () => {
		expect(isPrivateIpAddress('1.1.1.1')).toBe(false);
		expect(isPrivateIpAddress('8.8.8.8')).toBe(false);
		expect(isPrivateIpAddress('2606:4700:4700::1111')).toBe(false);
	});
});

describe('parsePublicHttpUrl', () => {
	it('allows http and https without credentials', () => {
		expect(parsePublicHttpUrl('https://example.com/avatar.png')?.hostname).toBe('example.com');
		expect(parsePublicHttpUrl('http://cdn.example.com/a.jpg')?.protocol).toBe('http:');
	});

	it('rejects non-http schemes, credentials, and local hosts', () => {
		expect(parsePublicHttpUrl('file:///etc/passwd')).toBeNull();
		expect(parsePublicHttpUrl('https://user:pass@example.com/x')).toBeNull();
		expect(parsePublicHttpUrl('http://localhost/avatar.png')).toBeNull();
		expect(parsePublicHttpUrl('http://127.0.0.1/avatar.png')).toBeNull();
		expect(parsePublicHttpUrl('http://169.254.169.254/latest/meta-data/')).toBeNull();
		expect(parsePublicHttpUrl('http://metadata.google.internal/')).toBeNull();
	});
});
