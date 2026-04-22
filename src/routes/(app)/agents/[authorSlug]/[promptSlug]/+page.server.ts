import type { PageServerLoad } from './$types';
import { getSupabase } from '$lib/supabase';
import { getPromptBySlug, getRelatedPrompts } from '$lib/server/queries';
import { getCachedPromptData, getCachedRelatedPrompts, CACHE_CONTROL } from '$lib/server/cache';
import { renderMarkdown } from '$lib/server/markdown';
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
			throw error(404, 'Agent prompt not found');
		}

		// Verify this is an agent prompt
		if (prompt.type !== 'agent') {
			throw error(404, 'Agent prompt not found');
		}

		const relatedPrompts = (async () => {
			try {
				return await getCachedRelatedPrompts('agents', authorSlug, promptSlug, () =>
					getRelatedPrompts(supabase, prompt, 4)
				);
			} catch (relatedError) {
				console.error('Failed to load related agents:', relatedError);
				return [];
			}
		})();

		// Pre-render and sanitize additional_information on the server so the
		// client receives safe HTML — no Markdown library is ever shipped to or
		// executed in the browser.
		const additionalInfoHtml = prompt.additional_information
			? renderMarkdown(prompt.additional_information)
			: null;

		return {
			prompt,
			additionalInfoHtml,
			relatedPrompts
		};
	} catch (err) {
		// Re-throw SvelteKit errors (like 404)
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		console.error('Failed to load agent prompt:', err);
		throw error(500, 'Failed to load agent prompt');
	}
};
