import type { PageServerLoad } from './$types';
import { getSupabase } from '$lib/supabase';
import { getPromptBySlug } from '$lib/server/queries';
import { getCachedPromptData, CACHE_CONTROL } from '$lib/server/cache';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const supabase = getSupabase();
	const { authorSlug, promptSlug } = params;

	// Set cache headers
	setHeaders({
		'Cache-Control': CACHE_CONTROL.PROMPT_PAGE
	});

	try {
		const prompt = await getCachedPromptData(authorSlug, promptSlug, () =>
			getPromptBySlug(supabase, authorSlug, promptSlug)
		);

		if (!prompt) {
			throw error(404, 'Prompt not found');
		}

		return {
			prompt
		};
	} catch (err) {
		// Re-throw SvelteKit errors (like 404)
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		console.error('Failed to load prompt:', err);
		throw error(500, 'Failed to load prompt');
	}
};
