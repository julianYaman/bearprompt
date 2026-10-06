import { DEFAULT_PROVIDERS } from './ai-providers';
import type { AiProviderConfig } from './types';

export const DEFAULT_PRIMARY_PROVIDER_COUNT = 2;

export const AUTHOR_RECOMMENDED_PROVIDERS: Record<string, readonly string[]> = {
	mistral: ['mistral', 'chatgpt', 'claude']
};

export function recommendedProviderIdsForPublicPrompt(input: {
	recommendedProviders?: string[] | null;
	authorSlug?: string | null;
}): string[] {
	const fromPrompt = (input.recommendedProviders ?? []).map((id) => id.trim()).filter(Boolean);
	if (fromPrompt.length > 0) return fromPrompt;

	const fromAuthor = input.authorSlug
		? AUTHOR_RECOMMENDED_PROVIDERS[input.authorSlug]
		: undefined;
	return fromAuthor ? [...fromAuthor] : [];
}

export function orderProvidersByRecommendation(
	providers: AiProviderConfig[],
	recommendedIds: string[]
): AiProviderConfig[] {
	if (recommendedIds.length === 0) return providers;

	const byId = new Map(providers.map((provider) => [provider.id, provider]));
	const seen = new Set<string>();
	const ordered: AiProviderConfig[] = [];

	for (const id of recommendedIds) {
		const provider = byId.get(id);
		if (!provider || seen.has(provider.id)) continue;
		seen.add(provider.id);
		ordered.push(provider);
	}

	for (const provider of providers) {
		if (seen.has(provider.id)) continue;
		seen.add(provider.id);
		ordered.push(provider);
	}

	return ordered;
}

export function primaryProviderCount(
	recommendedIds: string[],
	fallback = DEFAULT_PRIMARY_PROVIDER_COUNT
): number {
	if (recommendedIds.length === 0) return fallback;
	return Math.max(fallback, Math.min(3, recommendedIds.length));
}

export function providersForPublicPrompt(
	enabled: AiProviderConfig[],
	recommendedIds: string[],
	builtins: AiProviderConfig[] = DEFAULT_PROVIDERS
): AiProviderConfig[] {
	const available = new Map<string, AiProviderConfig>();
	for (const provider of builtins) {
		available.set(provider.id, { ...provider, enabled: true });
	}
	for (const provider of enabled) {
		available.set(provider.id, provider);
	}

	const combined: AiProviderConfig[] = [];
	const seen = new Set<string>();

	const push = (provider: AiProviderConfig) => {
		if (seen.has(provider.id)) return;
		seen.add(provider.id);
		combined.push(provider);
	};

	for (const id of recommendedIds) {
		const provider = available.get(id);
		if (provider) push(provider);
	}

	for (const provider of enabled) {
		if (provider.enabled !== false) push(provider);
	}

	return orderProvidersByRecommendation(combined, recommendedIds);
}
