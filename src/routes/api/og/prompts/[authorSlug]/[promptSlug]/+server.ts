import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import { getSupabase } from '$lib/supabase';
import { getCachedPromptData } from '$lib/server/cache';
import { enforceOgRateLimit } from '$lib/server/og-rate-limit';
import { renderPromptOgImage } from '$lib/server/og';
import { getPromptBySlug } from '$lib/server/queries';

export const GET: RequestHandler = async (event) => {
	enforceOgRateLimit(event);
	const supabase = getSupabase();
	const { authorSlug, promptSlug } = event.params;

	const prompt = await getCachedPromptData(authorSlug, promptSlug, () =>
		getPromptBySlug(supabase, authorSlug, promptSlug)
	);

	if (!prompt) {
		throw error(404, 'Prompt not found');
	}

	if (prompt.type === 'agent') {
		throw error(404, 'Prompt not found');
	}

	return renderPromptOgImage(prompt);
};
