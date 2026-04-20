import { LRUCache } from 'lru-cache';
import type {
	PublicLibraryData,
	SearchResults,
	AuthorPageData,
	AuthorPageDataGrouped,
	AgentLibraryData,
	PublicPrompt,
	PublicCategory,
	CategoryPageData
} from '$lib/types/public';

// Cache TTLs in milliseconds
const TTL = {
	MAIN_PAGE: 3 * 60 * 60 * 1000,      // 3 hours
	AUTHOR_PAGE: 1 * 60 * 60 * 1000,    // 1 hour
	PROMPT_PAGE: 12 * 60 * 60 * 1000,   // 12 hours
	RELATED_PROMPTS: 72 * 60 * 60 * 1000, // 72 hours
	SEARCH: 1 * 60 * 60 * 1000,         // 1 hour
	SITEMAP: 24 * 60 * 60 * 1000        // 24 hours
};

// HTTP Cache-Control header values (in seconds)
// max-age=0: browser must revalidate on every navigation (fixes stale SPA state)
// s-maxage: CDN/edge cache is kept intact at original durations
export const CACHE_CONTROL = {
	MAIN_PAGE:   'public, max-age=0, s-maxage=10800, stale-while-revalidate=3600',   // no browser cache, 3h CDN
	AUTHOR_PAGE: 'public, max-age=0, s-maxage=3600,  stale-while-revalidate=1800',   // no browser cache, 1h CDN
	PROMPT_PAGE: 'public, max-age=0, s-maxage=43200, stale-while-revalidate=7200',   // no browser cache, 12h CDN
	SEARCH:      'public, max-age=0, s-maxage=3600,  stale-while-revalidate=1800',   // no browser cache, 1h CDN
	SITEMAP:     'public, max-age=0, s-maxage=86400, stale-while-revalidate=3600'    // no browser cache, 24h CDN
};

// Cache for main library page data
const libraryCache = new LRUCache<string, PublicLibraryData>({
	max: 50,        // Max 50 pages cached
	ttl: TTL.MAIN_PAGE
});

// Cache for author pages
const authorCache = new LRUCache<string, AuthorPageData>({
	max: 100,       // Max 100 authors cached
	ttl: TTL.AUTHOR_PAGE
});

// Cache for individual prompts
const promptCache = new LRUCache<string, PublicPrompt>({
	max: 500,       // Max 500 prompts cached
	ttl: TTL.PROMPT_PAGE
});

// Cache for search results
const searchCache = new LRUCache<string, SearchResults>({
	max: 100,       // Max 100 search queries cached
	ttl: TTL.SEARCH
});

// Cache for agent library page data
const agentLibraryCache = new LRUCache<string, AgentLibraryData>({
	max: 50,        // Max 50 pages cached
	ttl: TTL.MAIN_PAGE
});

// Cache for agent search results
const agentSearchCache = new LRUCache<string, SearchResults>({
	max: 100,       // Max 100 search queries cached
	ttl: TTL.SEARCH
});

// Cache for author pages with grouped prompts
const authorGroupedCache = new LRUCache<string, AuthorPageDataGrouped>({
	max: 100,       // Max 100 authors cached
	ttl: TTL.AUTHOR_PAGE
});

const categoryListCache = new LRUCache<string, PublicCategory[]>({
	max: 1,
	ttl: TTL.MAIN_PAGE
});

const categoryPageCache = new LRUCache<string, CategoryPageData>({
	max: 100,
	ttl: TTL.AUTHOR_PAGE
});

const relatedPromptsCache = new LRUCache<string, PublicPrompt[]>({
	max: 1000,
	ttl: TTL.RELATED_PROMPTS
});

// Cache for sitemap XML
const sitemapCache = new LRUCache<string, string>({
	max: 1,
	ttl: TTL.SITEMAP
});

/**
 * Get cached library data or fetch fresh
 */
export async function getCachedLibraryData(
	page: number,
	fetcher: () => Promise<PublicLibraryData>
): Promise<PublicLibraryData> {
	const key = `page:${page}`;
	
	const cached = libraryCache.get(key);
	if (cached) {
		return cached;
	}
	
	const data = await fetcher();
	libraryCache.set(key, data);
	return data;
}

/**
 * Get cached author page data or fetch fresh
 */
export async function getCachedAuthorData(
	authorSlug: string,
	page: number,
	fetcher: () => Promise<AuthorPageData | null>
): Promise<AuthorPageData | null> {
	const key = `author:${authorSlug}:page:${page}`;
	
	const cached = authorCache.get(key);
	if (cached) {
		return cached;
	}
	
	const data = await fetcher();
	if (data) {
		authorCache.set(key, data);
	}
	return data;
}

/**
 * Get cached prompt data or fetch fresh
 */
export async function getCachedPromptData(
	authorSlug: string,
	promptSlug: string,
	fetcher: () => Promise<PublicPrompt | null>
): Promise<PublicPrompt | null> {
	const key = `prompt:${authorSlug}:${promptSlug}`;
	
	const cached = promptCache.get(key);
	if (cached) {
		return cached;
	}
	
	const data = await fetcher();
	if (data) {
		promptCache.set(key, data);
	}
	return data;
}

/**
 * Get cached search results or fetch fresh
 */
export async function getCachedSearchResults(
	query: string,
	page: number,
	fetcher: () => Promise<SearchResults>
): Promise<SearchResults> {
	const key = `search:${query.toLowerCase()}:page:${page}`;
	
	const cached = searchCache.get(key);
	if (cached) {
		return cached;
	}
	
	const data = await fetcher();
	searchCache.set(key, data);
	return data;
}

/**
 * Get cached agent library data or fetch fresh
 */
export async function getCachedAgentLibraryData(
	page: number,
	fetcher: () => Promise<AgentLibraryData>
): Promise<AgentLibraryData> {
	const key = `agent-page:${page}`;
	
	const cached = agentLibraryCache.get(key);
	if (cached) {
		return cached;
	}
	
	const data = await fetcher();
	agentLibraryCache.set(key, data);
	return data;
}

/**
 * Get cached agent search results or fetch fresh
 */
export async function getCachedAgentSearchResults(
	query: string,
	page: number,
	fetcher: () => Promise<SearchResults>
): Promise<SearchResults> {
	const key = `agent-search:${query.toLowerCase()}:page:${page}`;
	
	const cached = agentSearchCache.get(key);
	if (cached) {
		return cached;
	}
	
	const data = await fetcher();
	agentSearchCache.set(key, data);
	return data;
}

/**
 * Get cached author page data with grouped prompts or fetch fresh
 */
export async function getCachedAuthorDataGrouped(
	authorSlug: string,
	page: number,
	fetcher: () => Promise<AuthorPageDataGrouped | null>
): Promise<AuthorPageDataGrouped | null> {
	const key = `author-grouped:${authorSlug}:page:${page}`;
	
	const cached = authorGroupedCache.get(key);
	if (cached) {
		return cached;
	}
	
	const data = await fetcher();
	if (data) {
		authorGroupedCache.set(key, data);
	}
	return data;
}

export async function getCachedPromptCategories(
	fetcher: () => Promise<PublicCategory[]>
): Promise<PublicCategory[]> {
	const key = 'prompt-categories';
	const cached = categoryListCache.get(key);
	if (cached) {
		return cached;
	}

	const data = await fetcher();
	categoryListCache.set(key, data);
	return data;
}

export async function getCachedCategoryPageData(
	categorySlug: string,
	page: number,
	fetcher: () => Promise<CategoryPageData | null>
): Promise<CategoryPageData | null> {
	const key = `category:${categorySlug}:page:${page}`;
	const cached = categoryPageCache.get(key);
	if (cached) {
		return cached;
	}

	const data = await fetcher();
	if (data) {
		categoryPageCache.set(key, data);
	}
	return data;
}

export async function getCachedRelatedPrompts(
	routeGroup: 'prompts' | 'agents',
	authorSlug: string,
	promptSlug: string,
	fetcher: () => Promise<PublicPrompt[]>
): Promise<PublicPrompt[]> {
	const key = `related:${routeGroup}:${authorSlug}:${promptSlug}`;
	const cached = relatedPromptsCache.get(key);
	if (cached) {
		return cached;
	}

	const data = await fetcher();
	relatedPromptsCache.set(key, data);
	return data;
}

/**
 * Get cached sitemap XML or fetch fresh
 */
export async function getCachedSitemapXml(
	fetcher: () => Promise<string>
): Promise<string> {
	const key = 'sitemap';
	const cached = sitemapCache.get(key);
	if (cached) {
		return cached;
	}
	const xml = await fetcher();
	sitemapCache.set(key, xml);
	return xml;
}

/**
 * Clear all caches (useful for manual cache invalidation)
 */
export function clearAllCaches(): void {
	libraryCache.clear();
	authorCache.clear();
	promptCache.clear();
	relatedPromptsCache.clear();
	searchCache.clear();
	agentLibraryCache.clear();
	agentSearchCache.clear();
	authorGroupedCache.clear();
	categoryListCache.clear();
	categoryPageCache.clear();
	sitemapCache.clear();
}

/**
 * Clear specific cache types
 */
export function clearLibraryCache(): void {
	libraryCache.clear();
	categoryListCache.clear();
	categoryPageCache.clear();
}

export function clearAuthorCache(authorSlug?: string): void {
	if (authorSlug) {
		// Clear specific author's cache entries
		for (const key of authorCache.keys()) {
			if (key.startsWith(`author:${authorSlug}:`)) {
				authorCache.delete(key);
			}
		}
	} else {
		authorCache.clear();
	}
}

export function clearPromptCache(authorSlug?: string, promptSlug?: string): void {
	if (authorSlug && promptSlug) {
		promptCache.delete(`prompt:${authorSlug}:${promptSlug}`);
		relatedPromptsCache.delete(`related:prompts:${authorSlug}:${promptSlug}`);
		relatedPromptsCache.delete(`related:agents:${authorSlug}:${promptSlug}`);
	} else if (authorSlug) {
		for (const key of promptCache.keys()) {
			if (key.startsWith(`prompt:${authorSlug}:`)) {
				promptCache.delete(key);
			}
		}
		for (const key of relatedPromptsCache.keys()) {
			if (
				key.startsWith(`related:prompts:${authorSlug}:`) ||
				key.startsWith(`related:agents:${authorSlug}:`)
			) {
				relatedPromptsCache.delete(key);
			}
		}
	} else {
		promptCache.clear();
		relatedPromptsCache.clear();
	}
}

export function clearSearchCache(): void {
	searchCache.clear();
}

export function clearAgentLibraryCache(): void {
	agentLibraryCache.clear();
}

export function clearAgentSearchCache(): void {
	agentSearchCache.clear();
}

export function clearAuthorGroupedCache(authorSlug?: string): void {
	if (authorSlug) {
		for (const key of authorGroupedCache.keys()) {
			if (key.startsWith(`author-grouped:${authorSlug}:`)) {
				authorGroupedCache.delete(key);
			}
		}
	} else {
		authorGroupedCache.clear();
	}
}

/**
 * Get cache stats for debugging
 */
export function getCacheStats() {
	return {
		library: { size: libraryCache.size, max: 50 },
		author: { size: authorCache.size, max: 100 },
		prompt: { size: promptCache.size, max: 500 },
		relatedPrompts: { size: relatedPromptsCache.size, max: 1000 },
		search: { size: searchCache.size, max: 100 },
		agentLibrary: { size: agentLibraryCache.size, max: 50 },
		agentSearch: { size: agentSearchCache.size, max: 100 },
		authorGrouped: { size: authorGroupedCache.size, max: 100 },
		sitemap: { size: sitemapCache.size, max: 1 }
	};
}
