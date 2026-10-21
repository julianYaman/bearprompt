import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import { enforceOgRateLimit } from '$lib/server/og-rate-limit';
import { renderCategoryOgImage } from '$lib/server/og';
import { loadDecisionPack } from '$lib/server/decision-library';

export const GET: RequestHandler = async (event) => {
	enforceOgRateLimit(event);
	const { packSlug } = event.params;

	const data = await loadDecisionPack(packSlug);
	if (!data) {
		throw error(404, 'Decision pack not found');
	}

	return renderCategoryOgImage(data.category, 'Decision Pack');
};
