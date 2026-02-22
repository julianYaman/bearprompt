import type { PageServerLoad } from './$types';
import { supabase } from '$lib/supabase';
import { getPublicLibraryData, searchPrompts } from '$lib/server/queries';
import { getCachedLibraryData, getCachedSearchResults, CACHE_CONTROL } from '$lib/server/cache';

export const load: PageServerLoad = async ({ url, setHeaders }) => {
	const page = parseInt(url.searchParams.get('page') || '1', 10);
	const query = url.searchParams.get('q') || '';

	if (query.trim()) {
		// Search mode - set search cache headers
		setHeaders({
			'Cache-Control': CACHE_CONTROL.SEARCH
		});

		// Return promise for streaming with caching
		return {
			mode: 'search' as const,
			query: query.trim(),
			page,
			searchResults: getCachedSearchResults(query.trim(), page, () =>
				searchPrompts(supabase, query.trim(), page)
			).catch((error) => {
				console.error('Failed to search prompts:', error);
				return null;
			})
		};
	} else {
		// Browse mode - set main page cache headers
		setHeaders({
			'Cache-Control': CACHE_CONTROL.MAIN_PAGE
		});

		// Return promise for streaming with caching
		return {
			mode: 'browse' as const,
			page,
			libraryData: getCachedLibraryData(page, () =>
				getPublicLibraryData(supabase, page)
			).catch((error) => {
				console.error('Failed to load public library:', error);
				return null;
			})
		};
	}
};
