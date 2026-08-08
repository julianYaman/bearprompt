import { sanitizeExternalUrl } from './security';
import type { AiProviderConfig } from './types';

export const PROMPT_PLACEHOLDER = '{{prompt}}';
export const PROMPT_PLACEHOLDER_ALIAS = '%q';
export const SAFE_URL_LENGTH = 2000;

export const BUILTIN_PROVIDER_IDS = ['chatgpt', 'claude', 'perplexity', 'grok'] as const;
export type BuiltinProviderId = (typeof BUILTIN_PROVIDER_IDS)[number];

export const DEFAULT_PROVIDERS: AiProviderConfig[] = [
	{
		id: 'chatgpt',
		name: 'ChatGPT',
		urlTemplate: `https://chat.openai.com/?q=${PROMPT_PLACEHOLDER}`,
		isBuiltIn: true,
		enabled: true,
		sortOrder: 0
	},
	{
		id: 'claude',
		name: 'Claude',
		urlTemplate: `https://claude.ai/new?q=${PROMPT_PLACEHOLDER}`,
		isBuiltIn: true,
		enabled: true,
		sortOrder: 1
	},
	{
		id: 'perplexity',
		name: 'Perplexity',
		urlTemplate: `https://www.perplexity.ai/search?q=${PROMPT_PLACEHOLDER}`,
		isBuiltIn: true,
		enabled: true,
		sortOrder: 2
	},
	{
		id: 'grok',
		name: 'Grok',
		urlTemplate: `https://grok.com/?q=${PROMPT_PLACEHOLDER}`,
		isBuiltIn: true,
		enabled: true,
		sortOrder: 3
	}
];

const BUILTIN_DEFAULTS = new Map(DEFAULT_PROVIDERS.map((provider) => [provider.id, provider]));

export function hasPromptPlaceholder(template: string): boolean {
	return template.includes(PROMPT_PLACEHOLDER) || template.includes(PROMPT_PLACEHOLDER_ALIAS);
}

export function buildProviderUrl(template: string, promptText: string): string {
	const encoded = encodeURIComponent(promptText);
	return template
		.split(PROMPT_PLACEHOLDER)
		.join(encoded)
		.split(PROMPT_PLACEHOLDER_ALIAS)
		.join(encoded);
}

export function isUrlTooLong(url: string): boolean {
	return url.length > SAFE_URL_LENGTH;
}

export type ProviderTemplateValidation =
	| { ok: true }
	| { ok: false; error: string };

export function validateProviderTemplate(template: string): ProviderTemplateValidation {
	const trimmed = template.trim();
	if (!trimmed) {
		return { ok: false, error: 'URL template is required.' };
	}

	if (!hasPromptPlaceholder(trimmed)) {
		return {
			ok: false,
			error: `URL template must include ${PROMPT_PLACEHOLDER} or ${PROMPT_PLACEHOLDER_ALIAS}.`
		};
	}

	const sampleUrl = buildProviderUrl(trimmed, 'sample prompt');
	const sanitized = sanitizeExternalUrl(sampleUrl);
	if (!sanitized) {
		return {
			ok: false,
			error: 'URL template must be a valid http or https URL.'
		};
	}

	return { ok: true };
}

export function getBuiltinDefault(id: string): AiProviderConfig | undefined {
	return BUILTIN_DEFAULTS.get(id);
}

export function mergeProviderSettings(
	stored: AiProviderConfig[] | undefined | null,
	defaults: AiProviderConfig[] = DEFAULT_PROVIDERS
): AiProviderConfig[] {
	if (!stored || stored.length === 0) {
		return defaults.map((provider) => ({ ...provider }));
	}

	const defaultById = new Map(defaults.map((provider) => [provider.id, provider]));
	const seenBuiltInIds = new Set<string>();
	const merged: AiProviderConfig[] = [];

	for (const [index, provider] of stored.entries()) {
		if (!provider || typeof provider !== 'object') continue;
		if (typeof provider.id !== 'string' || !provider.id.trim()) continue;
		if (typeof provider.name !== 'string' || !provider.name.trim()) continue;
		if (typeof provider.urlTemplate !== 'string' || !provider.urlTemplate.trim()) continue;

		const isBuiltIn = Boolean(provider.isBuiltIn) || defaultById.has(provider.id);
		if (isBuiltIn) {
			const builtin = defaultById.get(provider.id);
			if (!builtin) continue;
			seenBuiltInIds.add(provider.id);
			merged.push({
				...builtin,
				name: provider.name.trim() || builtin.name,
				urlTemplate: provider.urlTemplate.trim() || builtin.urlTemplate,
				enabled: provider.enabled !== false,
				sortOrder: typeof provider.sortOrder === 'number' ? provider.sortOrder : index
			});
			continue;
		}

		merged.push({
			id: provider.id,
			name: provider.name.trim(),
			urlTemplate: provider.urlTemplate.trim(),
			isBuiltIn: false,
			enabled: provider.enabled !== false,
			sortOrder: typeof provider.sortOrder === 'number' ? provider.sortOrder : index
		});
	}

	for (const builtin of defaults) {
		if (!seenBuiltInIds.has(builtin.id)) {
			merged.push({
				...builtin,
				sortOrder: merged.length
			});
		}
	}

	return normalizeProviderOrder(merged);
}

export function normalizeProviderOrder(providers: AiProviderConfig[]): AiProviderConfig[] {
	return [...providers]
		.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
		.map((provider, index) => ({ ...provider, sortOrder: index }));
}

export function getEnabledProviders(providers: AiProviderConfig[]): AiProviderConfig[] {
	return normalizeProviderOrder(providers).filter((provider) => provider.enabled);
}

export function getProviderIconName(
	provider: AiProviderConfig
): 'chatgpt' | 'claude' | 'perplexity' | 'grok' | 'bot' {
	if (!provider.isBuiltIn) return 'bot';
	switch (provider.id) {
		case 'chatgpt':
			return 'chatgpt';
		case 'claude':
			return 'claude';
		case 'perplexity':
			return 'perplexity';
		case 'grok':
			return 'grok';
		default:
			return 'bot';
	}
}
