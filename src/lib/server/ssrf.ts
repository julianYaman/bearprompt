import dns from 'node:dns/promises';
import net from 'node:net';

const BLOCKED_HOSTNAMES = new Set([
	'localhost',
	'localhost.localdomain',
	'metadata.google.internal',
	'metadata.internal'
]);

function normalizeIp(ip: string): string {
	return ip.trim().toLowerCase().replace(/^\[|\]$/g, '');
}

export function isPrivateIpAddress(ip: string): boolean {
	const normalized = normalizeIp(ip);

	if (normalized.startsWith('::ffff:')) {
		return isPrivateIpAddress(normalized.slice(7));
	}

	if (net.isIP(normalized) === 4) {
		const parts = normalized.split('.').map((part) => Number(part));
		const [a, b] = parts;
		if (a === 0 || a === 10 || a === 127) return true;
		if (a === 169 && b === 254) return true;
		if (a === 172 && b >= 16 && b <= 31) return true;
		if (a === 192 && b === 168) return true;
		if (a === 100 && b >= 64 && b <= 127) return true;
		if (a === 198 && (b === 18 || b === 19)) return true;
		return false;
	}

	if (net.isIP(normalized) === 6) {
		if (normalized === '::1' || normalized === '::') return true;
		if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
		if (
			normalized.startsWith('fe8') ||
			normalized.startsWith('fe9') ||
			normalized.startsWith('fea') ||
			normalized.startsWith('feb')
		) {
			return true;
		}
		return false;
	}

	return true;
}

function isBlockedHostname(hostname: string): boolean {
	const host = hostname.replace(/^\[|\]$/g, '').toLowerCase();
	if (!host) return true;
	if (BLOCKED_HOSTNAMES.has(host)) return true;
	if (host.endsWith('.localhost') || host.endsWith('.internal') || host.endsWith('.local')) {
		return true;
	}
	if (net.isIP(host) && isPrivateIpAddress(host)) return true;
	return false;
}

/** Parse an http(s) URL that is safe to even attempt resolving. */
export function parsePublicHttpUrl(input: string, base?: string | URL): URL | null {
	let url: URL;
	try {
		url = new URL(input, base);
	} catch {
		return null;
	}

	if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
	if (url.username || url.password) return null;
	if (isBlockedHostname(url.hostname)) return null;
	return url;
}

/** Reject if the hostname is an IP or DNS result in a private range. */
export async function assertUrlResolvesPublic(url: URL): Promise<void> {
	const hostname = url.hostname.replace(/^\[|\]$/g, '');
	if (net.isIP(hostname)) {
		if (isPrivateIpAddress(hostname)) {
			throw new Error('Blocked private IP address');
		}
		return;
	}

	const records = await dns.lookup(hostname, { all: true, verbatim: true });
	if (records.length === 0) {
		throw new Error('Hostname did not resolve');
	}

	for (const record of records) {
		if (isPrivateIpAddress(record.address)) {
			throw new Error('Blocked private IP address');
		}
	}
}
