import type { PageServerLoad } from './$types';
import { getSupabase } from '$lib/supabase';
import { getAgentLibraryData, searchAgents } from '$lib/server/queries';
import { getCachedAgentLibraryData, getCachedAgentSearchResults, CACHE_CONTROL } from '$lib/server/cache';

export const load: PageServerLoad = async ({ url, setHeaders }) => {
	const page = parseInt(url.searchParams.get('page') || '1', 10);
	const supabase = getSupabase();
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
			searchResults: getCachedAgentSearchResults(query.trim(), page, () =>
				searchAgents(supabase, query.trim(), page)
			).catch((error) => {
				console.error('Failed to search agents:', error);
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
			libraryData: getCachedAgentLibraryData(page, () =>
				getAgentLibraryData(supabase, page)
			).catch((error) => {
				console.error('Failed to load agent library:', error);
				return null;
			})
		};
	}
};
