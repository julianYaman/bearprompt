import type { PageServerLoad } from './$types';
import { generateDecisionCode } from '$lib/decision-library';
import { loadDecisionSpec } from '$lib/server/decision-library';
import { CACHE_CONTROL } from '$lib/server/cache';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	setHeaders({
		'Cache-Control': CACHE_CONTROL.PROMPT_PAGE
	});

	const spec = await loadDecisionSpec(params.authorSlug, params.specSlug);
	if (!spec) {
		throw error(404, 'Decision example not found');
	}

	return {
		spec,
		code: {
			python: generateDecisionCode(spec, spec.pack, 'python', spec.recommendedModel),
			typescript: generateDecisionCode(spec, spec.pack, 'typescript', spec.recommendedModel),
			json: generateDecisionCode(spec, spec.pack, 'json', spec.recommendedModel)
		}
	};
};
