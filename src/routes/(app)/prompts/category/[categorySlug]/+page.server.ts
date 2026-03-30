import type { PageServerLoad } from './$types';
import { getSupabase } from '$lib/supabase';
import { getCategoryPageData } from '$lib/server/queries';
import { getCachedCategoryPageData, CACHE_CONTROL } from '$lib/server/cache';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, url, setHeaders }) => {
	const supabase = getSupabase();
	const page = parseInt(url.searchParams.get('page') || '1', 10);
	const categorySlug = params.categorySlug;

	setHeaders({
		'Cache-Control': CACHE_CONTROL.AUTHOR_PAGE
	});

	try {
		const data = await getCachedCategoryPageData(categorySlug, page, () =>
			getCategoryPageData(supabase, categorySlug, page)
		);

		if (!data) {
			throw error(404, 'Category not found');
		}

		return data;
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		console.error('Failed to load category page:', err);
		throw error(500, 'Failed to load category page');
	}
};
