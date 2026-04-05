import { deflate, inflate } from 'pako';

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
const NEW_PROMPT_HASH_PREFIX = '#new=';
const SHARE_ENVELOPE_VERSION = 1;
export const IV_LENGTH_BYTES = 12;
const META_LENGTH_BYTES = 4;

interface ShareEnvelopeMetadata {
	v: number;
	alg: 'A256GCM';
	compression: 'deflate';
	ivLength: number;
}

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

function arrayBufferViewToArrayBuffer(view: Uint8Array): ArrayBuffer {
	return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer;
}

function createShareEnvelopeMetadata(): ShareEnvelopeMetadata {
	return {
		v: SHARE_ENVELOPE_VERSION,
		alg: 'A256GCM',
		compression: 'deflate',
		ivLength: IV_LENGTH_BYTES
	};
}

export function createIV(): Uint8Array<ArrayBuffer> {
	return window.crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
}

function encodeMetaLength(length: number): Uint8Array {
	const bytes = new Uint8Array(META_LENGTH_BYTES);
	new DataView(bytes.buffer).setUint32(0, length, false);
	return bytes;
}

function decodeMetaLength(bytes: Uint8Array): number {
	if (bytes.byteLength < META_LENGTH_BYTES) {
		throw new Error('Invalid shared payload envelope');
	}

	return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0, false);
}

function encodeShareEnvelope(
	metadata: ShareEnvelopeMetadata,
	iv: Uint8Array,
	ciphertext: Uint8Array
): string {
	const metadataBytes = new TextEncoder().encode(JSON.stringify(metadata));
	const metaLengthBytes = encodeMetaLength(metadataBytes.byteLength);
	const envelope = new Uint8Array(
		metaLengthBytes.byteLength + metadataBytes.byteLength + iv.byteLength + ciphertext.byteLength
	);

	let offset = 0;
	envelope.set(metaLengthBytes, offset);
	offset += metaLengthBytes.byteLength;
	envelope.set(metadataBytes, offset);
	offset += metadataBytes.byteLength;
	envelope.set(iv, offset);
	offset += iv.byteLength;
	envelope.set(ciphertext, offset);

	return uint8ArrayToBase64Url(envelope);
}

function decodeShareEnvelope(encoded: string): {
	metadata: ShareEnvelopeMetadata;
	iv: Uint8Array;
	ciphertext: Uint8Array;
} {
	const envelope = base64UrlToUint8Array(encoded);
	const metadataLength = decodeMetaLength(envelope);
	const metadataStart = META_LENGTH_BYTES;
	const metadataEnd = metadataStart + metadataLength;
	if (envelope.byteLength <= metadataEnd) {
		throw new Error('Invalid shared payload envelope');
	}

	const metadataBytes = envelope.slice(metadataStart, metadataEnd);
	const metadata = JSON.parse(new TextDecoder().decode(metadataBytes)) as ShareEnvelopeMetadata;
	if (
		metadata.v !== SHARE_ENVELOPE_VERSION ||
		metadata.alg !== 'A256GCM' ||
		metadata.compression !== 'deflate' ||
		metadata.ivLength !== IV_LENGTH_BYTES
	) {
		throw new Error('Unsupported shared payload envelope');
	}

	const ivStart = metadataEnd;
	const ivEnd = ivStart + metadata.ivLength;
	if (envelope.byteLength <= ivEnd) {
		throw new Error('Invalid shared payload envelope');
	}

	return {
		metadata,
		iv: envelope.slice(ivStart, ivEnd),
		ciphertext: envelope.slice(ivEnd)
	};
}

function parseSharedPromptPayload(payload: unknown): SharedPromptPayload | null {
	if (!payload || typeof payload !== 'object') return null;

	const parsed = payload as {
		title?: unknown;
		markdown?: unknown;
		tags?: unknown;
	};

	if (
		typeof parsed.title !== 'string' ||
		typeof parsed.markdown !== 'string' ||
		!Array.isArray(parsed.tags) ||
		!parsed.tags.every((tag) => typeof tag === 'string')
	) {
		return null;
	}

	return {
		title: parsed.title,
		markdown: parsed.markdown,
		tags: parsed.tags
	};
}

export function buildShareUrl(shareId: string, key: string): string {
	return `${window.location.origin}/library${SHARE_HASH_PREFIX}${encodeURIComponent(shareId)}:${encodeURIComponent(key)}`;
}

export function buildNewPromptUrl(payload: SharedPromptPayload): string {
	const encoded = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify({ v: 1, ...payload })));
	return `${window.location.origin}/library${NEW_PROMPT_HASH_PREFIX}${encoded}`;
}

export function parseShareHash(hash: string): ShareReference | null {
	if (!hash.startsWith(SHARE_HASH_PREFIX)) return null;
	const value = hash.slice(SHARE_HASH_PREFIX.length);
	const separatorIndex = value.indexOf(':');
	if (separatorIndex <= 0) return null;

	try {
		const rawId = value.slice(0, separatorIndex);
		const rawKey = value.slice(separatorIndex + 1);
		const id = decodeURIComponent(rawId).trim();
		const key = decodeURIComponent(rawKey).trim();
		if (!id || !key) return null;

		return { id, key };
	} catch {
		return null;
	}
}

export function parseNewPromptHash(hash: string): SharedPromptPayload | null {
	if (!hash.startsWith(NEW_PROMPT_HASH_PREFIX)) return null;

	try {
		const encoded = hash.slice(NEW_PROMPT_HASH_PREFIX.length).trim();
		if (!encoded) return null;

		const decoded = new TextDecoder().decode(base64UrlToUint8Array(encoded));
		const parsed = JSON.parse(decoded) as { v?: unknown } & SharedPromptPayload;
		if (parsed.v !== 1) return null;

		return parseSharedPromptPayload(parsed);
	} catch {
		return null;
	}
}

export function readShareFromSession(): ShareReference | null {
	let raw = '';
	try {
		raw = sessionStorage.getItem(SHARE_SESSION_STORAGE_KEY) || '';
	} catch {
		return null;
	}
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
	try {
		sessionStorage.removeItem(SHARE_SESSION_STORAGE_KEY);
	} catch {
		// Ignore storage clear failures.
	}
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
	const compressedPlaintext = deflate(plaintext);
	const iv = createIV();
	const encrypted = await window.crypto.subtle.encrypt(
		{ name: 'AES-GCM', iv: arrayBufferViewToArrayBuffer(iv) },
		key,
		compressedPlaintext
	);
	const jwk = await window.crypto.subtle.exportKey('jwk', key);
	const exportedKey = typeof jwk.k === 'string' ? jwk.k : '';
	if (!exportedKey) {
		throw new Error('Failed to export key');
	}

	return {
		// The server stores this envelope as an opaque string and never sees the key.
		ciphertext: encodeShareEnvelope(createShareEnvelopeMetadata(), iv, new Uint8Array(encrypted)),
		key: exportedKey
	};
}

export async function decryptSharedPrompt(
	ciphertextBase64Url: string,
	keyBase64Url: string
): Promise<SharedPromptPayload> {
	const { metadata, iv, ciphertext } = decodeShareEnvelope(ciphertextBase64Url);
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
		{ name: 'AES-GCM', iv: arrayBufferViewToArrayBuffer(iv) },
		key,
		arrayBufferViewToArrayBuffer(ciphertext)
	);

	if (metadata.compression !== 'deflate') {
		throw new Error('Unsupported shared payload envelope');
	}

	const decoded = new TextDecoder().decode(inflate(new Uint8Array(decrypted)));
	const parsed = parseSharedPromptPayload(JSON.parse(decoded));
	if (!parsed) throw new Error('Invalid shared payload');
	return parsed;
}
