import { describe, expect, it } from 'vitest';
import { DEFAULT_PROVIDERS } from './ai-providers';
import {
	orderProvidersByRecommendation,
	primaryProviderCount,
	providersForPublicPrompt,
	recommendedProviderIdsForPublicPrompt
} from './recommended-providers';
import type { AiProviderConfig } from './types';

function provider(id: string, sortOrder: number): AiProviderConfig {
	return {
		id,
		name: id,
		urlTemplate: `https://example.com/?q={{prompt}}`,
		isBuiltIn: true,
		enabled: true,
		sortOrder
	};
}

describe('recommendedProviderIdsForPublicPrompt', () => {
	it('uses the prompt list when present', () => {
		expect(
			recommendedProviderIdsForPublicPrompt({
				recommendedProviders: ['mistral', 'chatgpt'],
				authorSlug: 'openai'
			})
		).toEqual(['mistral', 'chatgpt']);
	});

	it('falls back to the vendor author', () => {
		expect(recommendedProviderIdsForPublicPrompt({ authorSlug: 'mistral' })).toEqual([
			'mistral',
			'chatgpt',
			'claude'
		]);
	});

	it('returns no recommendations for other authors', () => {
		expect(recommendedProviderIdsForPublicPrompt({ authorSlug: 'openai' })).toEqual([]);
	});
});

describe('orderProvidersByRecommendation', () => {
	it('puts recommended providers first and keeps the rest', () => {
		const ordered = orderProvidersByRecommendation(
			[provider('chatgpt', 0), provider('claude', 1), provider('mistral', 2)],
			['mistral', 'chatgpt', 'claude']
		);
		expect(ordered.map((item) => item.id)).toEqual(['mistral', 'chatgpt', 'claude']);
	});
});

describe('providersForPublicPrompt', () => {
	it('surfaces a recommended builtin even when it is not in the enabled list yet', () => {
		const enabled = DEFAULT_PROVIDERS.filter((item) => item.id !== 'mistral').map((item) => ({
			...item
		}));
		const ordered = providersForPublicPrompt(enabled, ['mistral', 'chatgpt', 'claude']);
		expect(ordered.slice(0, 3).map((item) => item.id)).toEqual(['mistral', 'chatgpt', 'claude']);
	});
});

describe('primaryProviderCount', () => {
	it('keeps two buttons when nothing is recommended', () => {
		expect(primaryProviderCount([])).toBe(2);
	});

	it('shows three buttons for the Mistral pack recommendations', () => {
		expect(primaryProviderCount(['mistral', 'chatgpt', 'claude'])).toBe(3);
	});
});
