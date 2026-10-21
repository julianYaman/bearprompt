import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import { getSupabase } from '$lib/supabase';
import { enforceOgRateLimit } from '$lib/server/og-rate-limit';
import { publicAuthorFromDecisionAuthor, renderAuthorOgImage } from '$lib/server/og';
import { loadDecisionAuthor } from '$lib/server/decision-library';
import { getAuthorBySlug } from '$lib/server/queries';
import type { OgAuthorSection } from '$lib/seo';

function isOgAuthorSection(value: string): value is OgAuthorSection {
	return value === 'prompts' || value === 'agents' || value === 'decisions';
}

export const GET: RequestHandler = async (event) => {
	enforceOgRateLimit(event);
	const supabase = getSupabase();
	const { authorSlug, section } = event.params;

	if (!isOgAuthorSection(section)) {
		throw error(404, 'Author page not found');
	}

	if (section === 'decisions') {
		const data = await loadDecisionAuthor(authorSlug);
		if (!data) {
			throw error(404, 'Author not found');
		}

		return renderAuthorOgImage(publicAuthorFromDecisionAuthor(data.author), section);
	}

	const author = await getAuthorBySlug(supabase, authorSlug);
	if (!author) {
		throw error(404, 'Author not found');
	}

	return renderAuthorOgImage(author, section);
};
