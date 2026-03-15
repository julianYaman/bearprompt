export interface SharedPromptPayload {
	title: string;
	markdown: string;
	tags: string[];
}

export interface ShareReference {
	id: string;
	key: string;
}

export const SHARE_SESSION_STORAGE_KEY = '__bearprompt_share_ref_v1';
const SHARE_HASH_PREFIX = '#share=';
const ZERO_IV = new Uint8Array(12);

function uint8ArrayToBase64Url(data: Uint8Array): string {
	let binary = '';
	for (const byte of data) {
		binary += String.fromCharCode(byte);
	}
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToUint8Array(value: string): Uint8Array {
	const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
	const padding = (4 - (normalized.length % 4)) % 4;
	const binary = atob(normalized + '='.repeat(padding));
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
	return uint8ArrayToBase64Url(new Uint8Array(buffer));
}

function base64UrlToArrayBuffer(value: string): ArrayBuffer {
	const bytes = base64UrlToUint8Array(value);
	return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

export function buildShareUrl(shareId: string, key: string): string {
	return `${window.location.origin}/library${SHARE_HASH_PREFIX}${encodeURIComponent(shareId)}:${encodeURIComponent(key)}`;
}

export function parseShareHash(hash: string): ShareReference | null {
	if (!hash.startsWith(SHARE_HASH_PREFIX)) return null;
	const value = hash.slice(SHARE_HASH_PREFIX.length);
	const separatorIndex = value.indexOf(':');
	if (separatorIndex <= 0) return null;

	const rawId = value.slice(0, separatorIndex);
	const rawKey = value.slice(separatorIndex + 1);
	const id = decodeURIComponent(rawId).trim();
	const key = decodeURIComponent(rawKey).trim();
	if (!id || !key) return null;

	return { id, key };
}

export function readShareFromSession(): ShareReference | null {
	const raw = sessionStorage.getItem(SHARE_SESSION_STORAGE_KEY);
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw) as ShareReference;
		if (!parsed.id || !parsed.key) return null;
		return parsed;
	} catch {
		return null;
	}
}

export function clearShareFromSession(): void {
	sessionStorage.removeItem(SHARE_SESSION_STORAGE_KEY);
}

export async function encryptSharedPrompt(payload: SharedPromptPayload): Promise<{
	ciphertext: string;
	key: string;
}> {
	const key = await window.crypto.subtle.generateKey(
		{ name: 'AES-GCM', length: 256 },
		true,
		['encrypt', 'decrypt']
	);

	const plaintext = new TextEncoder().encode(JSON.stringify(payload));
	const encrypted = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv: ZERO_IV }, key, plaintext);
	const jwk = await window.crypto.subtle.exportKey('jwk', key);
	const exportedKey = typeof jwk.k === 'string' ? jwk.k : '';
	if (!exportedKey) {
		throw new Error('Failed to export key');
	}

	return {
		ciphertext: arrayBufferToBase64Url(encrypted),
		key: exportedKey
	};
}

export async function decryptSharedPrompt(
	ciphertextBase64Url: string,
	keyBase64Url: string
): Promise<SharedPromptPayload> {
	const key = await window.crypto.subtle.importKey(
		'jwk',
		{
			k: keyBase64Url,
			alg: 'A256GCM',
			ext: true,
			key_ops: ['decrypt'],
			kty: 'oct'
		},
		{ name: 'AES-GCM', length: 256 },
		false,
		['decrypt']
	);

	const decrypted = await window.crypto.subtle.decrypt(
		{ name: 'AES-GCM', iv: ZERO_IV },
		key,
		base64UrlToArrayBuffer(ciphertextBase64Url)
	);

	const decoded = new TextDecoder().decode(new Uint8Array(decrypted));
	const parsed = JSON.parse(decoded) as SharedPromptPayload;
	if (
		typeof parsed.title !== 'string' ||
		typeof parsed.markdown !== 'string' ||
		!Array.isArray(parsed.tags) ||
		!parsed.tags.every((tag) => typeof tag === 'string')
	) {
		throw new Error('Invalid shared payload');
	}

	return parsed;
}
