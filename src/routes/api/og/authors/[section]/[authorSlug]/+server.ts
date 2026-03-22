import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import { getSupabase } from '$lib/supabase';
import { renderAuthorOgImage } from '$lib/server/og';
import { getAuthorBySlug } from '$lib/server/queries';
import type { OgAuthorSection } from '$lib/seo';

function isOgAuthorSection(value: string): value is OgAuthorSection {
	return value === 'prompts' || value === 'agents';
}

export const GET: RequestHandler = async ({ params }) => {
	const supabase = getSupabase();
	const { authorSlug, section } = params;

	if (!isOgAuthorSection(section)) {
		throw error(404, 'Author page not found');
	}

	const author = await getAuthorBySlug(supabase, authorSlug);
	if (!author) {
		throw error(404, 'Author not found');
	}

	return renderAuthorOgImage(author, section);
};
