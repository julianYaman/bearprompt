import type { PageServerLoad } from './$types';
import { loadDecisionPack } from '$lib/server/decision-library';
import { CACHE_CONTROL } from '$lib/server/cache';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	setHeaders({
		'Cache-Control': CACHE_CONTROL.AUTHOR_PAGE
	});

	const data = await loadDecisionPack(params.packSlug);
	if (!data) {
		throw error(404, 'Decision pack not found');
	}

	return data;
};
