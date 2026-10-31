import {
	getDecisionAuthor,
	getDecisionPack,
	getDecisionSpec,
	listAuthorSpecs,
	listPackCategoriesFromSpecs,
	listResolvedSpecs,
	overlayDecisionAuthor,
	overlayPackCategory,
	packAsCategory,
	resolveSpec,
	searchDecisionSpecs
} from '$lib/decision-library';
import { specsFromPrompts } from '$lib/decision-library/from-db';
import type { DecisionAuthor, DecisionPack, ResolvedDecisionSpec } from '$lib/decision-library/types';
import { getSupabase } from '$lib/supabase';
import type { PublicAuthor, PublicCategory, PublicPrompt } from '$lib/types/public';
import { getDecisionPackCategories, getDecisionPrompts } from './queries';

export type DecisionLibrarySnapshot = {
	authors: DecisionAuthor[];
	packs: DecisionPack[];
	specs: ResolvedDecisionSpec[];
	packCategories: PublicCategory[];
};

function catalogSnapshot(chrome: PublicCategory[] = []): DecisionLibrarySnapshot {
	const specs = listResolvedSpecs().map((spec) => overlayResolvedSpec(spec, chrome));
	return {
		authors: [...new Map(specs.map((spec) => [spec.author.slug, spec.author])).values()],
		packs: uniquePacks(specs),
		specs,
		packCategories: listPackCategoriesFromSpecs(specs, chrome)
	};
}

function authorsFromPrompts(prompts: PublicPrompt[]): Map<string, PublicAuthor> {
	const authors = new Map<string, PublicAuthor>();
	for (const prompt of prompts) {
		if (prompt.author) authors.set(prompt.author.slug, prompt.author);
	}
	return authors;
}

function overlayResolvedSpec(
	spec: ResolvedDecisionSpec,
	chrome: PublicCategory[],
	authors: Map<string, PublicAuthor> = new Map()
): ResolvedDecisionSpec {
	const category = chrome.find((entry) => entry.slug === spec.pack.slug);
	return {
		...spec,
		author: overlayDecisionAuthor(spec.author, authors.get(spec.author.slug)),
		pack: overlayPackCategory(spec.pack, category)
	};
}

function uniquePacks(specs: ResolvedDecisionSpec[]): DecisionPack[] {
	return [...new Map(specs.map((spec) => [spec.pack.slug, spec.pack])).values()].sort(
		(a, b) => a.sortOrder - b.sortOrder
	);
}

async function snapshotFromSupabase(): Promise<DecisionLibrarySnapshot | null> {
	const supabase = getSupabase();
	const [prompts, chrome] = await Promise.all([
		getDecisionPrompts(supabase),
		getDecisionPackCategories(supabase)
	]);
	const authors = authorsFromPrompts(prompts);
	const specs = specsFromPrompts(prompts)
		.map((spec) => {
			try {
				return overlayResolvedSpec(resolveSpec(spec), chrome, authors);
			} catch {
				return null;
			}
		})
		.filter((spec): spec is ResolvedDecisionSpec => spec !== null);

	if (specs.length === 0) return null;

	return {
		authors: [...new Map(specs.map((spec) => [spec.author.slug, spec.author])).values()],
		packs: uniquePacks(specs),
		specs,
		packCategories: listPackCategoriesFromSpecs(specs, chrome)
	};
}

export async function loadDecisionLibrary(): Promise<DecisionLibrarySnapshot> {
	try {
		return (await snapshotFromSupabase()) ?? catalogSnapshot();
	} catch {
		return catalogSnapshot();
	}
}

export async function loadDecisionHome(query: string) {
	const library = await loadDecisionLibrary();
	const packs = library.packCategories;

	if (query) {
		return {
			mode: 'search' as const,
			query,
			results: searchDecisionSpecs(query, library.specs),
			packs
		};
	}

	return {
		mode: 'browse' as const,
		query: '',
		results: library.specs,
		packs
	};
}

export async function loadDecisionPack(packSlug: string) {
	const library = await loadDecisionLibrary();
	const pack = library.packs.find((entry) => entry.slug === packSlug) ?? getDecisionPack(packSlug);
	if (!pack) return null;

	const author =
		library.authors.find((entry) => entry.slug === pack.authorSlug) ??
		getDecisionAuthor(pack.authorSlug);
	if (!author) return null;

	const specs = library.specs.filter((spec) => spec.packSlug === pack.slug);
	const category =
		library.packCategories.find((entry) => entry.slug === pack.slug) ??
		packAsCategory(pack, specs.length);
	return {
		pack,
		author,
		category,
		specs
	};
}

export async function loadDecisionAuthor(authorSlug: string) {
	const library = await loadDecisionLibrary();
	const author =
		library.authors.find((entry) => entry.slug === authorSlug) ?? getDecisionAuthor(authorSlug);
	if (!author) return null;

	const specs = library.specs.filter((spec) => spec.authorSlug === author.slug);
	return {
		author,
		specs: specs.length > 0 ? specs : listAuthorSpecs(author.slug)
	};
}

export async function loadDecisionSpec(authorSlug: string, specSlug: string) {
	const library = await loadDecisionLibrary();
	return (
		library.specs.find(
			(spec) => spec.authorSlug === authorSlug && spec.slug === specSlug
		) ?? getDecisionSpec(authorSlug, specSlug)
	);
}
