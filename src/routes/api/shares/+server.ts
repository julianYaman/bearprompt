import { json, type RequestHandler } from '@sveltejs/kit';
import { getSupabaseService } from '$lib/supabase';
import {
	SHARE_MAX_BYTES,
	SHARE_TTL_DAYS,
	decodeCiphertextSize,
	evaluateRateLimit,
	extractClientIp,
	generateRevokeToken,
	generateShareId,
	hashToken,
	registerRateLimitedRequest,
	verifyCaptchaToken
} from '$lib/server/share';

function noStoreHeaders() {
	return {
		'Cache-Control': 'no-store, max-age=0',
		Pragma: 'no-cache'
	};
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const ip = extractClientIp(request.headers);
		const rateStatus = evaluateRateLimit(ip);
		if (!rateStatus.allowed) {
			return json({ error: 'Too many requests' }, { status: 429, headers: noStoreHeaders() });
		}
		registerRateLimitedRequest(ip);

		let body: { ciphertext?: unknown; captchaToken?: unknown };
		try {
			body = await request.json();
		} catch {
			return json({ error: 'Invalid request' }, { status: 400, headers: noStoreHeaders() });
		}

		const ciphertext = typeof body.ciphertext === 'string' ? body.ciphertext : '';
		const captchaToken = typeof body.captchaToken === 'string' ? body.captchaToken : '';

		if (!ciphertext) {
			return json({ error: 'Invalid request' }, { status: 400, headers: noStoreHeaders() });
		}

		if (rateStatus.requiresCaptcha) {
			const captchaOk = await verifyCaptchaToken(captchaToken, ip);
			if (!captchaOk) {
				return json({ error: 'Captcha required' }, { status: 403, headers: noStoreHeaders() });
			}
		}

		let payloadSizeBytes = 0;
		try {
			payloadSizeBytes = decodeCiphertextSize(ciphertext);
		} catch {
			return json({ error: 'Invalid request' }, { status: 400, headers: noStoreHeaders() });
		}

		if (payloadSizeBytes <= 0 || payloadSizeBytes > SHARE_MAX_BYTES) {
			return json({ error: 'Invalid request' }, { status: 400, headers: noStoreHeaders() });
		}

		const now = Date.now();
		const expiresAt = new Date(now + SHARE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
		const revokeToken = generateRevokeToken();
		const revokeTokenHash = hashToken(revokeToken);
		const shareId = generateShareId();

		const supabase = getSupabaseService();
		const { data, error } = await supabase
			.from('shared_prompts')
			.insert({
				id: shareId,
				ciphertext,
				expires_at: expiresAt,
				revoke_token_hash: revokeTokenHash,
				payload_size_bytes: payloadSizeBytes
			})
			.select('id, expires_at')
			.single();

		if (error || !data) {
			const reason =
				error?.code === '42P01'
					? 'Database table shared_prompts is missing'
					: error?.code === '42501'
						? 'Database permission denied. Check service role key and RLS setup'
						: 'Failed to create share';
			return json({ error: reason }, { status: 500, headers: noStoreHeaders() });
		}

		return json(
			{
				id: data.id,
				expiresAt: data.expires_at,
				revokeToken
			},
			{ status: 201, headers: noStoreHeaders() }
		);
	} catch (err) {
		console.error('Share create failed:', err instanceof Error ? err.message : err);
		return json(
			{ error: 'Server configuration error. Check Supabase service role key.' },
			{ status: 500, headers: noStoreHeaders() }
		);
	}
};
