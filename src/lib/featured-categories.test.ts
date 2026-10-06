import { describe, expect, it } from 'vitest';
import {
	featuredCategoriesWithStarterFallback,
	splitLibraryCategories,
	STARTER_CATEGORY_SLUG
} from './featured-categories';
import type { PublicCategory } from './types/public';

function category(overrides: Partial<PublicCategory> = {}): PublicCategory {
	return {
		id: 'writing',
		slug: 'writing',
		name: 'Writing',
		description: 'Writing prompts',
		color: '#000000',
		icon_key: 'pencil-line',
		promptCount: 4,
		tags: [],
		...overrides
	};
}

const starter = category({
	id: STARTER_CATEGORY_SLUG,
	slug: STARTER_CATEGORY_SLUG,
	name: 'Starter Prompts for ChatGPT'
});

describe('featuredCategoriesWithStarterFallback', () => {
	it('appends the starter card when the library has no matching category', () => {
		const writing = category();
		expect(featuredCategoriesWithStarterFallback([writing], starter)).toEqual([writing, starter]);
	});

	it('keeps the data category when the starter slug already exists', () => {
		const fromDb = category({
			id: 'db-starter',
			slug: STARTER_CATEGORY_SLUG,
			name: 'Starter Prompts for ChatGPT',
			promptCount: 12
		});
		expect(featuredCategoriesWithStarterFallback([fromDb], starter)).toEqual([fromDb]);
	});
});

describe('splitLibraryCategories', () => {
	it('keeps use-case categories in featured and model packs in Prompt Guides', () => {
		const writing = category({ sort_order: 1 });
		const images = category({
			id: 'chatgpt-images-2-0',
			slug: 'chatgpt-images-2-0',
			name: 'ChatGPT Images 2.0',
			sort_order: 1001
		});
		expect(splitLibraryCategories([writing, images])).toEqual({
			featured: [writing],
			guides: [images]
		});
	});

	it('duplicates pinned Prompt Guides into Featured', () => {
		const writing = category({ sort_order: 1 });
		const pack = category({
			id: 'mistral-large-4',
			slug: 'mistral-large-4',
			name: 'Mistral Large 4',
			sort_order: 1000
		});
		expect(splitLibraryCategories([writing, pack])).toEqual({
			featured: [pack, writing],
			guides: [pack]
		});
	});
});
