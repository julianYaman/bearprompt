import type { PageServerLoad } from './$types';
import { loadDecisionHome } from '$lib/server/decision-library';
import { CACHE_CONTROL } from '$lib/server/cache';
import { normalizeSearchQuery } from '$lib/search';

export const load: PageServerLoad = async ({ url, setHeaders }) => {
	const query = normalizeSearchQuery(url.searchParams.get('q') || '');
	setHeaders({
		'Cache-Control': query ? CACHE_CONTROL.SEARCH : CACHE_CONTROL.MAIN_PAGE
	});
	return loadDecisionHome(query);
};
