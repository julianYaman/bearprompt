import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { customAlphabet } from 'nanoid';
import { env } from '$env/dynamic/private';

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_SOFT_LIMIT = 5;
const RATE_LIMIT_HARD_LIMIT = 20;

const requestBuckets = new Map<string, number[]>();

export const SHARE_MAX_BYTES = 64 * 1024;
export const SHARE_TTL_DAYS = 14;
export const SHARE_ID_LENGTH = 15;
const SHARE_ID_REGEX = new RegExp(`^[A-Za-z0-9_-]{${SHARE_ID_LENGTH}}$`);
const LEGACY_UUID_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const generateShareIdInternal = customAlphabet(
	'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-',
	SHARE_ID_LENGTH
);

function base64urlToBuffer(value: string): Buffer {
	const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
	const padding = (4 - (normalized.length % 4)) % 4;
	return Buffer.from(normalized + '='.repeat(padding), 'base64');
}

export function extractClientIp(headers: Headers): string {
	const normalizeIp = (value: string | null): string | null => {
		if (!value) return null;
		const trimmed = value.trim();
		if (!trimmed) return null;
		if (!/^[0-9a-fA-F:.]+$/.test(trimmed)) return null;
		return trimmed;
	};

	const cfConnectingIp = normalizeIp(headers.get('cf-connecting-ip'));
	if (cfConnectingIp) {
		return cfConnectingIp;
	}

	const forwardedFor = headers.get('x-forwarded-for');
	if (forwardedFor) {
		const firstForwarded = normalizeIp(forwardedFor.split(',')[0] ?? null);
		if (firstForwarded) {
			return firstForwarded;
		}
	}
	const realIp = normalizeIp(headers.get('x-real-ip'));
	return realIp || 'unknown';
}

export function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

export function secureTokenEquals(hashedToken: string, providedToken: string): boolean {
	const providedHashed = hashToken(providedToken);
	const left = Buffer.from(hashedToken, 'hex');
	const right = Buffer.from(providedHashed, 'hex');
	if (left.length !== right.length) return false;
	return timingSafeEqual(left, right);
}

export function generateRevokeToken(): string {
	return randomBytes(32).toString('base64url');
}

export function generateShareId(): string {
	return generateShareIdInternal();
}

export function isValidShareId(value: string): boolean {
	return SHARE_ID_REGEX.test(value) || LEGACY_UUID_REGEX.test(value);
}

export function decodeCiphertextSize(ciphertextBase64Url: string): number {
	return base64urlToBuffer(ciphertextBase64Url).byteLength;
}

/**
 * Normalize ciphertext values read from Supabase.
 * Supports:
 * - text column storing base64url directly
 * - bytea column returned as Postgres hex format (\x...)
 */
export function normalizeCiphertextFromDb(value: unknown): string | null {
	if (typeof value !== 'string' || !value) return null;

	// text column path
	if (!value.startsWith('\\x')) {
		return value;
	}

	// bytea hex path (\x...)
	const hex = value.slice(2);
	if (hex.length === 0 || hex.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(hex)) {
		return null;
	}

	const bytes = Buffer.from(hex, 'hex');
	const asUtf8 = bytes.toString('utf8');

	// If the stored bytes are literally the base64url characters, recover that directly.
	if (/^[A-Za-z0-9_-]+$/.test(asUtf8) && asUtf8.length > 0) {
		return asUtf8;
	}

	// Otherwise, assume the bytea contains raw encrypted bytes.
	return bytes.toString('base64url');
}

function cleanupOldEntries(timestamps: number[], now: number): number[] {
	return timestamps.filter((ts) => now - ts <= RATE_LIMIT_WINDOW_MS);
}

export function evaluateRateLimit(ip: string): {
	allowed: boolean;
	requiresCaptcha: boolean;
} {
	const now = Date.now();
	const timestamps = cleanupOldEntries(requestBuckets.get(ip) || [], now);
	requestBuckets.set(ip, timestamps);

	if (timestamps.length >= RATE_LIMIT_HARD_LIMIT) {
		return { allowed: false, requiresCaptcha: true };
	}

	if (timestamps.length >= RATE_LIMIT_SOFT_LIMIT) {
		return { allowed: true, requiresCaptcha: true };
	}

	return { allowed: true, requiresCaptcha: false };
}

export function registerRateLimitedRequest(ip: string): void {
	const now = Date.now();
	const current = cleanupOldEntries(requestBuckets.get(ip) || [], now);
	current.push(now);
	requestBuckets.set(ip, current);
}

export async function verifyCaptchaToken(token: string, ip: string): Promise<boolean> {
	if (!token) return false;
	if (!env.TURNSTILE_SECRET_KEY) return false;

	const body = new URLSearchParams({
		secret: env.TURNSTILE_SECRET_KEY,
		response: token,
		remoteip: ip
	});

	try {
		const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body
		});
		if (!response.ok) return false;
		const result = await response.json();
		return !!result.success;
	} catch {
		return false;
	}
}
