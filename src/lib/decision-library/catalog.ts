import { DECISION_AUTHORS } from './authors';
import { DECISION_PACKS } from './packs';
import { D1_ULTRA_SPECS } from './specs-d1-ultra';
import { JEV_SPECS } from './specs-jev';
import type {
	DecisionAuthor,
	DecisionPack,
	DecisionSpec,
	ResolvedDecisionSpec
} from './types';
import type { PublicCategory } from '$lib/types/public';

const SPECS: DecisionSpec[] = [...D1_ULTRA_SPECS, ...JEV_SPECS];

function authorsBySlug(): Map<string, DecisionAuthor> {
	return new Map(DECISION_AUTHORS.map((author) => [author.slug, author]));
}

function packsBySlug(): Map<string, DecisionPack> {
	return new Map(DECISION_PACKS.map((pack) => [pack.slug, pack]));
}

export function listDecisionAuthors(): DecisionAuthor[] {
	return DECISION_AUTHORS;
}

export function getDecisionAuthor(slug: string): DecisionAuthor | null {
	return authorsBySlug().get(slug) ?? null;
}

export function listDecisionPacks(): DecisionPack[] {
	return [...DECISION_PACKS].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getDecisionPack(slug: string): DecisionPack | null {
	return packsBySlug().get(slug) ?? null;
}

export function listDecisionSpecs(packSlug?: string): DecisionSpec[] {
	const specs = packSlug ? SPECS.filter((spec) => spec.packSlug === packSlug) : SPECS;
	return [...specs].sort((a, b) => a.title.localeCompare(b.title));
}

export function resolveSpec(spec: DecisionSpec): ResolvedDecisionSpec {
	const author = getDecisionAuthor(spec.authorSlug);
	const pack = getDecisionPack(spec.packSlug);
	if (!author) {
		throw new Error(`Unknown decision author: ${spec.authorSlug}`);
	}
	if (!pack) {
		throw new Error(`Unknown decision pack: ${spec.packSlug}`);
	}

	const recommendedModel = spec.recommendedModel ?? pack.defaultModel;
	if (!author.modelFamily.includes(recommendedModel)) {
		throw new Error(
			`Recommended model ${recommendedModel} is not in ${author.slug} family`
		);
	}

	return {
		...spec,
		recommendedModel,
		author,
		pack
	};
}

export function getDecisionSpec(authorSlug: string, specSlug: string): ResolvedDecisionSpec | null {
	const spec = SPECS.find(
		(entry) => entry.authorSlug === authorSlug && entry.slug === specSlug
	);
	return spec ? resolveSpec(spec) : null;
}

export function listResolvedSpecs(packSlug?: string): ResolvedDecisionSpec[] {
	return listDecisionSpecs(packSlug).map(resolveSpec);
}

export function listAuthorSpecs(authorSlug: string): ResolvedDecisionSpec[] {
	return SPECS.filter((spec) => spec.authorSlug === authorSlug)
		.sort((a, b) => a.title.localeCompare(b.title))
		.map(resolveSpec);
}

export function searchDecisionSpecs(
	query: string,
	specs: ResolvedDecisionSpec[] = listResolvedSpecs()
): ResolvedDecisionSpec[] {
	const needle = query.trim().toLowerCase();
	if (!needle) return [];

	return specs.filter((spec) => {
		const haystack = [
			spec.title,
			spec.description,
			spec.tags.join(' '),
			...spec.questions.map((question) => `${question.name} ${question.instructions}`)
		]
			.join(' ')
			.toLowerCase();
		return haystack.includes(needle);
	});
}

export type DecisionPackCategoryChrome = Pick<
	PublicCategory,
	| 'id'
	| 'slug'
	| 'name'
	| 'description'
	| 'color'
	| 'color_light'
	| 'color_dark'
	| 'source_url'
	| 'new_until'
	| 'sort_order'
>;

export function overlayPackCategory(
	pack: DecisionPack,
	chrome?: DecisionPackCategoryChrome | null
): DecisionPack {
	if (!chrome) return pack;
	return {
		...pack,
		name: chrome.name,
		description: chrome.description,
		color: chrome.color,
		sourceUrl: chrome.source_url ?? pack.sourceUrl,
		newUntil: chrome.new_until ?? pack.newUntil,
		sortOrder: chrome.sort_order ?? pack.sortOrder
	};
}

export function packAsCategory(
	pack: DecisionPack,
	specCount?: number,
	chrome?: DecisionPackCategoryChrome | null
): PublicCategory {
	const author = getDecisionAuthor(pack.authorSlug);
	const overlaid = overlayPackCategory(pack, chrome);
	return {
		id: chrome?.id ?? overlaid.slug,
		slug: overlaid.slug,
		name: overlaid.name,
		description: overlaid.description,
		color: overlaid.color,
		color_light: chrome?.color_light ?? null,
		color_dark: chrome?.color_dark ?? null,
		icon_key: author?.icon ?? 'square-check',
		promptCount: specCount ?? listDecisionSpecs(overlaid.slug).length,
		tags: author ? [{ id: author.slug, name: author.name }] : [],
		source_url: overlaid.sourceUrl,
		new_until: overlaid.newUntil,
		sort_order: overlaid.sortOrder,
		externalUrl: `/decisions/category/${overlaid.slug}`
	};
}

export function listPackCategories(): PublicCategory[] {
	return listDecisionPacks().map((pack) => packAsCategory(pack));
}

export function listPackCategoriesFromSpecs(
	specs: ResolvedDecisionSpec[],
	chrome: DecisionPackCategoryChrome[] = []
): PublicCategory[] {
	const chromeBySlug = new Map(chrome.map((category) => [category.slug, category]));
	return listDecisionPacks().map((pack) =>
		packAsCategory(
			pack,
			specs.filter((spec) => spec.packSlug === pack.slug).length,
			chromeBySlug.get(pack.slug)
		)
	);
}
