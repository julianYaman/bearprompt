import type { SupabaseClient } from '@supabase/supabase-js';
import type {
	PublicAuthor,
	PublicPrompt,
	AuthorWithPrompts,
	PublicLibraryData,
	SearchResults,
	AuthorPageData
} from '$lib/types/public';

const AUTHORS_PER_PAGE = 10;
const PROMPTS_PREVIEW_LIMIT = 6;
const PROMPTS_PER_PAGE = 30;
const SEARCH_RESULTS_PER_PAGE = 24;

/**
 * Fetch tags for a list of prompt IDs in a single query
 */
async function getTagsForPrompts(
	supabase: SupabaseClient,
	promptIds: string[]
): Promise<Map<string, { id: string; name: string }[]>> {
	if (promptIds.length === 0) return new Map();

	const { data, error } = await supabase
		.from('tag-to-prompt')
		.select(
			`
			prompt_id,
			tags:tag_id (
				id,
				name
			)
		`
		)
		.in('prompt_id', promptIds);

	if (error) throw error;

	const tagMap = new Map<string, { id: string; name: string }[]>();

	for (const row of data || []) {
		const promptId = row.prompt_id;
		const tag = row.tags as unknown as { id: string; name: string };

		if (!tagMap.has(promptId)) {
			tagMap.set(promptId, []);
		}
		if (tag) {
			tagMap.get(promptId)!.push(tag);
		}
	}

	return tagMap;
}

/**
 * Attach tags to prompts
 */
async function attachTagsToPrompts(
	supabase: SupabaseClient,
	prompts: PublicPrompt[]
): Promise<PublicPrompt[]> {
	if (prompts.length === 0) return [];
	
	const promptIds = prompts.map((p) => p.id);
	const tagMap = await getTagsForPrompts(supabase, promptIds);

	return prompts.map((prompt) => ({
		...prompt,
		tags: tagMap.get(prompt.id) || []
	}));
}

/**
 * Get prompt counts for multiple authors in a single query
 * Returns a map of author_id -> prompt count
 */
async function getPromptCountsForAuthors(
	supabase: SupabaseClient,
	authorIds: string[]
): Promise<Map<string, number>> {
	if (authorIds.length === 0) return new Map();

	// Use a raw query to get counts grouped by author_id
	const { data, error } = await supabase
		.from('prompts')
		.select('author_id')
		.in('author_id', authorIds);

	if (error) throw error;

	// Count prompts per author
	const countMap = new Map<string, number>();
	for (const row of data || []) {
		const count = countMap.get(row.author_id) || 0;
		countMap.set(row.author_id, count + 1);
	}

	return countMap;
}

/**
 * Get prompts for multiple authors in a single query
 * Uses window functions to get the first N prompts per author
 */
async function getPromptsForAuthors(
	supabase: SupabaseClient,
	authorIds: string[],
	limit: number = PROMPTS_PREVIEW_LIMIT
): Promise<Map<string, PublicPrompt[]>> {
	if (authorIds.length === 0) return new Map();

	// Fetch all prompts for these authors, ordered by created_at
	const { data, error } = await supabase
		.from('prompts')
		.select('*')
		.in('author_id', authorIds)
		.order('created_at', { ascending: false });

	if (error) throw error;

	// Group prompts by author and limit to first N
	const promptsByAuthor = new Map<string, PublicPrompt[]>();
	
	for (const prompt of data || []) {
		const authorPrompts = promptsByAuthor.get(prompt.author_id) || [];
		if (authorPrompts.length < limit) {
			authorPrompts.push(prompt);
			promptsByAuthor.set(prompt.author_id, authorPrompts);
		}
	}

	return promptsByAuthor;
}

/**
 * Build authors with prompts from fetched data
 */
async function buildAuthorsWithPrompts(
	supabase: SupabaseClient,
	authors: PublicAuthor[],
	promptsByAuthor: Map<string, PublicPrompt[]>,
	countsByAuthor: Map<string, number>
): Promise<AuthorWithPrompts[]> {
	// Collect all prompt IDs for tag fetching
	const allPrompts: PublicPrompt[] = [];
	for (const prompts of promptsByAuthor.values()) {
		allPrompts.push(...prompts);
	}

	// Fetch all tags in a single query
	const promptsWithTags = await attachTagsToPrompts(supabase, allPrompts);
	
	// Create a map for quick lookup
	const promptsWithTagsMap = new Map<string, PublicPrompt>();
	for (const prompt of promptsWithTags) {
		promptsWithTagsMap.set(prompt.id, prompt);
	}

	// Build the final result
	return authors.map((author) => {
		const authorPrompts = promptsByAuthor.get(author.id) || [];
		const promptsWithTagsForAuthor = authorPrompts.map(
			(p) => promptsWithTagsMap.get(p.id) || p
		);

		return {
			...author,
			prompts: promptsWithTagsForAuthor,
			totalPrompts: countsByAuthor.get(author.id) || 0
		};
	});
}

/**
 * Get highlighted authors with their first 6 prompts
 * Optimized: Uses 3 queries total instead of N+1
 */
export async function getHighlightedAuthors(supabase: SupabaseClient): Promise<AuthorWithPrompts[]> {
	// Query 1: Get highlighted authors
	const { data: authors, error: authorsError } = await supabase
		.from('authors')
		.select('*')
		.eq('highlighted', true)
		.order('name');

	if (authorsError) throw authorsError;
	if (!authors || authors.length === 0) return [];

	const authorIds = authors.map((a) => a.id);

	// Query 2 & 3: Get all prompts and counts in parallel
	const [promptsByAuthor, countsByAuthor] = await Promise.all([
		getPromptsForAuthors(supabase, authorIds),
		getPromptCountsForAuthors(supabase, authorIds)
	]);

	// Query 4: Get all tags (done inside buildAuthorsWithPrompts)
	return buildAuthorsWithPrompts(supabase, authors, promptsByAuthor, countsByAuthor);
}

/**
 * Get paginated non-highlighted authors with their first 6 prompts
 * Optimized: Uses 4 queries total instead of N+1
 */
export async function getAuthors(
	supabase: SupabaseClient,
	page: number = 1
): Promise<{ authors: AuthorWithPrompts[]; total: number }> {
	const offset = (page - 1) * AUTHORS_PER_PAGE;

	// Query 1: Get total count and paginated authors in parallel
	const [countResult, authorsResult] = await Promise.all([
		supabase
			.from('authors')
			.select('*', { count: 'exact', head: true })
			.eq('highlighted', false),
		supabase
			.from('authors')
			.select('*')
			.eq('highlighted', false)
			.order('name')
			.range(offset, offset + AUTHORS_PER_PAGE - 1)
	]);

	const totalCount = countResult.count || 0;
	
	if (authorsResult.error) throw authorsResult.error;
	if (!authorsResult.data || authorsResult.data.length === 0) {
		return { authors: [], total: totalCount };
	}

	const authors = authorsResult.data;
	const authorIds = authors.map((a) => a.id);

	// Query 2 & 3: Get all prompts and counts in parallel
	const [promptsByAuthor, countsByAuthor] = await Promise.all([
		getPromptsForAuthors(supabase, authorIds),
		getPromptCountsForAuthors(supabase, authorIds)
	]);

	// Query 4: Get all tags (done inside buildAuthorsWithPrompts)
	const authorsWithPrompts = await buildAuthorsWithPrompts(
		supabase,
		authors,
		promptsByAuthor,
		countsByAuthor
	);

	return { authors: authorsWithPrompts, total: totalCount };
}

/**
 * Get public library data for the main page
 */
export async function getPublicLibraryData(
	supabase: SupabaseClient,
	page: number = 1
): Promise<PublicLibraryData> {
	// Run both queries in parallel for better performance
	const [highlightedAuthors, { authors, total }] = await Promise.all([
		getHighlightedAuthors(supabase),
		getAuthors(supabase, page)
	]);

	const totalPages = Math.ceil(total / AUTHORS_PER_PAGE);

	return {
		highlightedAuthors,
		authors,
		totalAuthors: total,
		currentPage: page,
		totalPages
	};
}

/**
 * Search prompts across all authors
 */
export async function searchPrompts(
	supabase: SupabaseClient,
	query: string,
	page: number = 1
): Promise<SearchResults> {
	const offset = (page - 1) * SEARCH_RESULTS_PER_PAGE;
	const searchPattern = `%${query}%`;

	// Run count and data queries in parallel
	const [countResult, dataResult] = await Promise.all([
		supabase
			.from('prompts')
			.select('*', { count: 'exact', head: true })
			.or(`title.ilike.${searchPattern},description.ilike.${searchPattern},prompt.ilike.${searchPattern}`),
		supabase
			.from('prompts')
			.select(`
				*,
				author:author_id (*)
			`)
			.or(`title.ilike.${searchPattern},description.ilike.${searchPattern},prompt.ilike.${searchPattern}`)
			.order('created_at', { ascending: false })
			.range(offset, offset + SEARCH_RESULTS_PER_PAGE - 1)
	]);

	if (dataResult.error) throw dataResult.error;

	const totalCount = countResult.count || 0;
	const promptsWithTags = await attachTagsToPrompts(supabase, dataResult.data || []);
	const totalPages = Math.ceil(totalCount / SEARCH_RESULTS_PER_PAGE);

	return {
		prompts: promptsWithTags,
		totalResults: totalCount,
		currentPage: page,
		totalPages,
		query
	};
}

/**
 * Get single author by ID
 */
export async function getAuthorById(
	supabase: SupabaseClient,
	authorId: string
): Promise<PublicAuthor | null> {
	const { data, error } = await supabase.from('authors').select('*').eq('id', authorId).single();

	if (error) {
		if (error.code === 'PGRST116') return null; // Not found
		throw error;
	}

	return data;
}

/**
 * Get author page data with paginated prompts
 */
export async function getAuthorPageData(
	supabase: SupabaseClient,
	authorId: string,
	page: number = 1
): Promise<AuthorPageData | null> {
	const author = await getAuthorById(supabase, authorId);
	if (!author) return null;

	const offset = (page - 1) * PROMPTS_PER_PAGE;

	// Run count and data queries in parallel
	const [countResult, dataResult] = await Promise.all([
		supabase
			.from('prompts')
			.select('*', { count: 'exact', head: true })
			.eq('author_id', authorId),
		supabase
			.from('prompts')
			.select('*')
			.eq('author_id', authorId)
			.order('created_at', { ascending: false })
			.range(offset, offset + PROMPTS_PER_PAGE - 1)
	]);

	if (dataResult.error) throw dataResult.error;

	const totalCount = countResult.count || 0;
	const promptsWithTags = await attachTagsToPrompts(supabase, dataResult.data || []);
	const totalPages = Math.ceil(totalCount / PROMPTS_PER_PAGE);

	return {
		author,
		prompts: promptsWithTags,
		totalPrompts: totalCount,
		currentPage: page,
		totalPages
	};
}

/**
 * Get a single prompt by ID with author and tags
 */
export async function getPromptById(
	supabase: SupabaseClient,
	promptId: string
): Promise<PublicPrompt | null> {
	const { data: prompt, error } = await supabase
		.from('prompts')
		.select(`
			*,
			author:author_id (*)
		`)
		.eq('id', promptId)
		.single();

	if (error) {
		if (error.code === 'PGRST116') return null; // Not found
		throw error;
	}

	const promptsWithTags = await attachTagsToPrompts(supabase, [prompt]);
	return promptsWithTags[0] || null;
}

/**
 * Get single author by slug
 */
export async function getAuthorBySlug(
	supabase: SupabaseClient,
	slug: string
): Promise<PublicAuthor | null> {
	const { data, error } = await supabase
		.from('authors')
		.select('*')
		.eq('slug', slug)
		.single();

	if (error) {
		if (error.code === 'PGRST116') return null; // Not found
		throw error;
	}

	return data;
}

/**
 * Get author page data by slug with paginated prompts
 */
export async function getAuthorPageDataBySlug(
	supabase: SupabaseClient,
	authorSlug: string,
	page: number = 1
): Promise<AuthorPageData | null> {
	const author = await getAuthorBySlug(supabase, authorSlug);
	if (!author) return null;

	const offset = (page - 1) * PROMPTS_PER_PAGE;

	// Run count and data queries in parallel
	const [countResult, dataResult] = await Promise.all([
		supabase
			.from('prompts')
			.select('*', { count: 'exact', head: true })
			.eq('author_id', author.id),
		supabase
			.from('prompts')
			.select('*')
			.eq('author_id', author.id)
			.order('created_at', { ascending: false })
			.range(offset, offset + PROMPTS_PER_PAGE - 1)
	]);

	if (dataResult.error) throw dataResult.error;

	const totalCount = countResult.count || 0;
	const promptsWithTags = await attachTagsToPrompts(supabase, dataResult.data || []);
	const totalPages = Math.ceil(totalCount / PROMPTS_PER_PAGE);

	return {
		author,
		prompts: promptsWithTags,
		totalPrompts: totalCount,
		currentPage: page,
		totalPages
	};
}

/**
 * Get a single prompt by author slug and prompt slug with author and tags
 */
export async function getPromptBySlug(
	supabase: SupabaseClient,
	authorSlug: string,
	promptSlug: string
): Promise<PublicPrompt | null> {
	// First get the author by slug
	const author = await getAuthorBySlug(supabase, authorSlug);
	if (!author) return null;

	// Then get the prompt by author_id and prompt slug
	const { data: prompt, error } = await supabase
		.from('prompts')
		.select(`
			*,
			author:author_id (*)
		`)
		.eq('author_id', author.id)
		.eq('slug', promptSlug)
		.single();

	if (error) {
		if (error.code === 'PGRST116') return null; // Not found
		throw error;
	}

	const promptsWithTags = await attachTagsToPrompts(supabase, [prompt]);
	return promptsWithTags[0] || null;
}
