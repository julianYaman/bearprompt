import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import { getSupabase } from '$lib/supabase';
import { getCachedPromptData } from '$lib/server/cache';
import { renderPromptOgImage } from '$lib/server/og';
import { getPromptBySlug } from '$lib/server/queries';

export const GET: RequestHandler = async ({ params }) => {
	const supabase = getSupabase();
	const { authorSlug, promptSlug } = params;

	const prompt = await getCachedPromptData(authorSlug, promptSlug, () =>
		getPromptBySlug(supabase, authorSlug, promptSlug)
	);

	if (!prompt || prompt.type !== 'agent') {
		throw error(404, 'Agent prompt not found');
	}

	return renderPromptOgImage(prompt);
};
