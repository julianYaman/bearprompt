import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import { enforceOgRateLimit } from '$lib/server/og-rate-limit';
import { renderDecisionExampleOgImage } from '$lib/server/og';
import { loadDecisionSpec } from '$lib/server/decision-library';

export const GET: RequestHandler = async (event) => {
	enforceOgRateLimit(event);
	const { authorSlug, specSlug } = event.params;

	const spec = await loadDecisionSpec(authorSlug, specSlug);
	if (!spec) {
		throw error(404, 'Decision example not found');
	}

	return renderDecisionExampleOgImage(spec);
};
