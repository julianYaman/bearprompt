import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import { getSupabase } from '$lib/supabase';
import { getCachedPromptCategories } from '$lib/server/cache';
import { renderCategoryOgImage } from '$lib/server/og';
import { getPromptCategories } from '$lib/server/queries';

export const GET: RequestHandler = async ({ params }) => {
	const supabase = getSupabase();
	const { categorySlug } = params;

	const categories = await getCachedPromptCategories(() => getPromptCategories(supabase));
	const category = categories.find((entry) => entry.slug === categorySlug);

	if (!category) {
		throw error(404, 'Category not found');
	}

	return renderCategoryOgImage(category);
};
