import { isCategoryNew } from './category-new';
import type { PublicCategory } from './types/public';

export const STARTER_CATEGORY_SLUG = 'starter-prompts-chatgpt';
export const PROMPT_GUIDE_SORT_ORDER_MIN = 1000;
export const PROMPT_GUIDE_BLOG_CATEGORY = 'Prompt Guides';

export function featuredCategoriesWithStarterFallback(
	categories: PublicCategory[],
	starter: PublicCategory
): PublicCategory[] {
	if (categories.some((category) => category.slug === starter.slug)) {
		return categories;
	}
	return [...categories, starter];
}

export function uniqueCategoriesBySlug(categories: PublicCategory[]): PublicCategory[] {
	const seen = new Set<string>();
	const unique: PublicCategory[] = [];
	for (const category of categories) {
		if (seen.has(category.slug)) continue;
		seen.add(category.slug);
		unique.push(category);
	}
	return unique;
}

export function splitLibraryCategories(
	categories: PublicCategory[],
	now: Date = new Date()
): {
	featured: PublicCategory[];
	guides: PublicCategory[];
} {
	const featured: PublicCategory[] = [];
	const guides: PublicCategory[] = [];

	for (const category of uniqueCategoriesBySlug(categories)) {
		if ((category.sort_order ?? 0) >= PROMPT_GUIDE_SORT_ORDER_MIN) {
			guides.push(category);
		} else {
			featured.push(category);
		}
	}

	const pinnedGuides = guides.filter((category) => isCategoryNew(category, now));
	return {
		featured: [...pinnedGuides, ...featured],
		guides
	};
}
