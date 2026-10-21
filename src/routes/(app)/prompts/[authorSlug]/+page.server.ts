import type { PageServerLoad } from './$types';
import { getSupabase } from '$lib/supabase';
import { getAuthorPageDataBySlug } from '$lib/server/queries';
import { getCachedAuthorData, CACHE_CONTROL } from '$lib/server/cache';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, url, setHeaders }) => {
	const supabase = getSupabase();
	const page = parseInt(url.searchParams.get('page') || '1', 10);
	const authorSlug = params.authorSlug;

	// Set cache headers
	setHeaders({
		'Cache-Control': CACHE_CONTROL.AUTHOR_PAGE
	});

	try {
		const data = await getCachedAuthorData(authorSlug, page, () =>
			getAuthorPageDataBySlug(supabase, authorSlug, page)
		);

		if (!data) {
			throw error(404, 'Author not found');
		}

		const prompts = data.prompts.filter((prompt) => prompt.type === 'prompt');
		if (prompts.length === 0) {
			throw error(404, 'Author not found');
		}

		return {
			author: data.author,
			prompts,
			totalPrompts: prompts.length,
			currentPage: data.currentPage,
			totalPages: 1
		};
	} catch (err) {
		// Re-throw SvelteKit errors (like 404)
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		console.error('Failed to load author page:', err);
		throw error(500, 'Failed to load author page');
	}
};
