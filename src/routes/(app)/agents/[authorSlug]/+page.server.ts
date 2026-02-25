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
		// Note: For now, we reuse the same author page data which includes all prompts
		// In the future, we could filter to only show agent prompts here
		const data = await getCachedAuthorData(authorSlug, page, () =>
			getAuthorPageDataBySlug(supabase, authorSlug, page)
		);

		if (!data) {
			throw error(404, 'Author not found');
		}

		// Filter to only include agent prompts
		const agentPrompts = data.prompts.filter(p => p.type === 'agent');

		return {
			author: data.author,
			prompts: agentPrompts,
			totalPrompts: agentPrompts.length,
			currentPage: data.currentPage,
			totalPages: 1 // Since we're filtering client-side for now
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
