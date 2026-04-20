import type { PageServerLoad } from './$types';
import { getSupabase } from '$lib/supabase';
import { getPromptBySlug, getRelatedPrompts } from '$lib/server/queries';
import { getCachedPromptData, getCachedRelatedPrompts, CACHE_CONTROL } from '$lib/server/cache';
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

		const relatedPrompts = (async () => {
			try {
				return await getCachedRelatedPrompts('prompts', authorSlug, promptSlug, () =>
					getRelatedPrompts(supabase, prompt, 4)
				);
			} catch (relatedError) {
				console.error('Failed to load related prompts:', relatedError);
				return [];
			}
		})();

		return {
			prompt,
			relatedPrompts
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
