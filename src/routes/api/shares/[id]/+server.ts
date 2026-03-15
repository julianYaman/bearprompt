import { json, type RequestHandler } from '@sveltejs/kit';
import { getSupabaseService } from '$lib/supabase';
import { isValidShareId, normalizeCiphertextFromDb, secureTokenEquals } from '$lib/server/share';

function noStoreHeaders() {
	return {
		'Cache-Control': 'no-store, max-age=0',
		Pragma: 'no-cache'
	};
}

export const GET: RequestHandler = async ({ params }) => {
	const shareId = params.id ?? '';
	if (!isValidShareId(shareId)) {
		return json({ error: 'Share not found' }, { status: 404, headers: noStoreHeaders() });
	}

	try {
		const supabase = getSupabaseService();
		const now = new Date().toISOString();
		const { data, error } = await supabase
			.from('shared_prompts')
			.select('ciphertext, expires_at')
			.eq('id', shareId)
			.is('revoked_at', null)
			.gt('expires_at', now)
			.single();

		if (error || !data) {
			return json({ error: 'Share not found' }, { status: 404, headers: noStoreHeaders() });
		}

		const normalizedCiphertext = normalizeCiphertextFromDb(data.ciphertext);
		if (!normalizedCiphertext) {
			return json({ error: 'Share not found' }, { status: 404, headers: noStoreHeaders() });
		}

		return json(
			{
				ciphertext: normalizedCiphertext
			},
			{
				headers: noStoreHeaders()
			}
		);
	} catch {
		return json({ error: 'Share not found' }, { status: 404, headers: noStoreHeaders() });
	}
};

export const DELETE: RequestHandler = async ({ params, request }) => {
	const shareId = params.id ?? '';
	if (!isValidShareId(shareId)) {
		return json({ error: 'Share not found' }, { status: 404, headers: noStoreHeaders() });
	}

	const authHeader = request.headers.get('authorization') || '';
	const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : '';
	if (!token) {
		return json({ error: 'Unauthorized' }, { status: 401, headers: noStoreHeaders() });
	}

	try {
		const supabase = getSupabaseService();
		const { data, error } = await supabase
			.from('shared_prompts')
			.select('id, revoke_token_hash')
			.eq('id', shareId)
			.single();

		if (error || !data) {
			return json({ error: 'Share not found' }, { status: 404, headers: noStoreHeaders() });
		}

		const tokenMatches = secureTokenEquals(data.revoke_token_hash, token);
		if (!tokenMatches) {
			return json({ error: 'Unauthorized' }, { status: 401, headers: noStoreHeaders() });
		}

		const { error: deleteError } = await supabase.from('shared_prompts').delete().eq('id', shareId);
		if (deleteError) {
			return json({ error: 'Failed to revoke share' }, { status: 500, headers: noStoreHeaders() });
		}

		return new Response(null, { status: 204, headers: noStoreHeaders() });
	} catch (err) {
		console.error('Share revoke failed:', err instanceof Error ? err.message : err);
		return json(
			{ error: 'Server configuration error. Check Supabase service role key.' },
			{ status: 500, headers: noStoreHeaders() }
		);
	}
};
