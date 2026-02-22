import { LRUCache } from 'lru-cache';
import type {
	PublicLibraryData,
	SearchResults,
	AuthorPageData,
	PublicPrompt
} from '$lib/types/public';

// Cache TTLs in milliseconds
const TTL = {
	MAIN_PAGE: 3 * 60 * 60 * 1000,      // 3 hours
	AUTHOR_PAGE: 1 * 60 * 60 * 1000,    // 1 hour
	PROMPT_PAGE: 12 * 60 * 60 * 1000,   // 12 hours
	SEARCH: 1 * 60 * 60 * 1000          // 1 hour
};

// HTTP Cache-Control header values (in seconds)
export const CACHE_CONTROL = {
	MAIN_PAGE: 'public, max-age=1800, s-maxage=10800, stale-while-revalidate=3600',     // 30min browser, 3h CDN
	AUTHOR_PAGE: 'public, max-age=900, s-maxage=3600, stale-while-revalidate=1800',     // 15min browser, 1h CDN
	PROMPT_PAGE: 'public, max-age=3600, s-maxage=43200, stale-while-revalidate=7200',   // 1h browser, 12h CDN
	SEARCH: 'public, max-age=900, s-maxage=3600, stale-while-revalidate=1800'           // 15min browser, 1h CDN
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
 * Clear all caches (useful for manual cache invalidation)
 */
export function clearAllCaches(): void {
	libraryCache.clear();
	authorCache.clear();
	promptCache.clear();
	searchCache.clear();
}

/**
 * Clear specific cache types
 */
export function clearLibraryCache(): void {
	libraryCache.clear();
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
	} else if (authorSlug) {
		for (const key of promptCache.keys()) {
			if (key.startsWith(`prompt:${authorSlug}:`)) {
				promptCache.delete(key);
			}
		}
	} else {
		promptCache.clear();
	}
}

export function clearSearchCache(): void {
	searchCache.clear();
}

/**
 * Get cache stats for debugging
 */
export function getCacheStats() {
	return {
		library: { size: libraryCache.size, max: 50 },
		author: { size: authorCache.size, max: 100 },
		prompt: { size: promptCache.size, max: 500 },
		search: { size: searchCache.size, max: 100 }
	};
}
