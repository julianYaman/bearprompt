import { describe, expect, it } from 'vitest';
import {
	DEFAULT_PROVIDERS,
	DESKTOP_SAFE_URL_LENGTH,
	SAFE_URL_LENGTH,
	buildProviderUrl,
	getEnabledProviders,
	getProviderIconName,
	getUrlLengthLimit,
	hasPromptPlaceholder,
	isDesktopAgentProvider,
	isUrlTooLong,
	mergeProviderSettings,
	normalizeProviderOrder,
	validateProviderTemplate
} from './ai-providers';
import type { AiProviderConfig } from './types';

describe('ai providers', () => {
	it('detects prompt placeholders', () => {
		expect(hasPromptPlaceholder('https://chat.example.com/?q={{prompt}}')).toBe(true);
		expect(hasPromptPlaceholder('https://chat.example.com/?q=%q')).toBe(true);
		expect(hasPromptPlaceholder('https://chat.example.com/')).toBe(false);
	});

	it('builds provider urls with encoded prompts', () => {
		expect(buildProviderUrl('https://chat.example.com/?q={{prompt}}', 'hello world')).toBe(
			'https://chat.example.com/?q=hello%20world'
		);
		expect(buildProviderUrl('https://chat.example.com/?q=%q', 'a&b')).toBe(
			'https://chat.example.com/?q=a%26b'
		);
	});

	it('validates http and desktop deep-link templates', () => {
		expect(validateProviderTemplate('https://chat.example.com/?q={{prompt}}')).toEqual({
			ok: true
		});
		expect(
			validateProviderTemplate('cursor://anysphere.cursor-deeplink/prompt?text={{prompt}}')
		).toEqual({ ok: true });
		expect(validateProviderTemplate('claude-cli://open?q={{prompt}}')).toEqual({ ok: true });
		expect(validateProviderTemplate('codex://new?prompt={{prompt}}')).toEqual({ ok: true });
		expect(validateProviderTemplate('')).toEqual({
			ok: false,
			error: 'URL template is required.'
		});
		expect(validateProviderTemplate('https://chat.example.com/')).toMatchObject({
			ok: false
		});
		expect(validateProviderTemplate('javascript:alert(1)?q={{prompt}}')).toMatchObject({
			ok: false
		});
		expect(validateProviderTemplate('file:///tmp/x?q={{prompt}}')).toMatchObject({
			ok: false
		});
	});

	it('uses higher length limits for desktop deep links', () => {
		const longPrompt = 'x'.repeat(3000);
		const webUrl = buildProviderUrl('https://chat.example.com/?q={{prompt}}', longPrompt);
		const desktopUrl = buildProviderUrl('cursor://anysphere.cursor-deeplink/prompt?text={{prompt}}', longPrompt);
		expect(getUrlLengthLimit(webUrl)).toBe(SAFE_URL_LENGTH);
		expect(getUrlLengthLimit(desktopUrl)).toBe(DESKTOP_SAFE_URL_LENGTH);
		expect(isUrlTooLong(webUrl)).toBe(true);
		expect(isUrlTooLong(desktopUrl)).toBe(false);
	});

	it('returns defaults when nothing is stored', () => {
		expect(mergeProviderSettings(null)).toEqual(DEFAULT_PROVIDERS);
		expect(mergeProviderSettings([])).toEqual(DEFAULT_PROVIDERS);
	});

	it('preserves custom providers and hidden built-ins', () => {
		const stored: AiProviderConfig[] = [
			{
				id: 'chatgpt',
				name: 'ChatGPT',
				urlTemplate: 'https://chat.openai.com/?q={{prompt}}',
				isBuiltIn: true,
				enabled: false,
				sortOrder: 1
			},
			{
				id: 'custom-1',
				name: 'My Chat',
				urlTemplate: 'https://chat.example.com/?q={{prompt}}',
				isBuiltIn: false,
				enabled: true,
				sortOrder: 0
			}
		];

		const merged = mergeProviderSettings(stored);
		expect(merged[0].id).toBe('custom-1');
		expect(merged.find((p) => p.id === 'chatgpt')?.enabled).toBe(false);
		expect(merged.some((p) => p.id === 'claude')).toBe(true);
		expect(merged.some((p) => p.id === 'grok')).toBe(true);
	});

	it('adds newly introduced desktop built-ins on upgrade', () => {
		const stored: AiProviderConfig[] = [
			{
				id: 'chatgpt',
				name: 'ChatGPT',
				urlTemplate: 'https://chat.openai.com/?q={{prompt}}',
				isBuiltIn: true,
				enabled: true,
				sortOrder: 0
			}
		];

		const merged = mergeProviderSettings(stored);
		expect(merged.map((p) => p.id)).toEqual([
			'chatgpt',
			'claude',
			'perplexity',
			'grok',
			'cursor',
			'claude-code',
			'codex'
		]);
		expect(merged.find((p) => p.id === 'cursor')?.enabled).toBe(true);
		expect(merged.find((p) => p.id === 'claude-code')?.enabled).toBe(true);
		expect(merged.find((p) => p.id === 'codex')?.enabled).toBe(true);
		expect(merged.find((p) => p.id === 'codex')?.name).toBe('ChatGPT (Desktop)');
	});

	it('renames legacy Codex label to ChatGPT (Desktop)', () => {
		const stored: AiProviderConfig[] = [
			{
				id: 'codex',
				name: 'Codex',
				urlTemplate: 'codex://new?prompt={{prompt}}',
				isBuiltIn: true,
				enabled: true,
				sortOrder: 0
			}
		];
		const merged = mergeProviderSettings(stored);
		expect(merged.find((p) => p.id === 'codex')?.name).toBe('ChatGPT (Desktop)');
	});

	it('maps provider icons including desktop agents', () => {
		expect(getProviderIconName(DEFAULT_PROVIDERS.find((p) => p.id === 'cursor')!)).toBe('cursor');
		expect(getProviderIconName(DEFAULT_PROVIDERS.find((p) => p.id === 'claude-code')!)).toBe(
			'claude-code'
		);
		expect(DEFAULT_PROVIDERS.find((p) => p.id === 'codex')?.name).toBe('ChatGPT (Desktop)');
		expect(getProviderIconName(DEFAULT_PROVIDERS.find((p) => p.id === 'codex')!)).toBe('chatgpt');
		expect(isDesktopAgentProvider(DEFAULT_PROVIDERS.find((p) => p.id === 'cursor')!)).toBe(true);
		expect(isDesktopAgentProvider(DEFAULT_PROVIDERS.find((p) => p.id === 'chatgpt')!)).toBe(false);
	});

	it('normalizes sort order and filters enabled providers', () => {
		const providers: AiProviderConfig[] = [
			{ ...DEFAULT_PROVIDERS[1], enabled: false, sortOrder: 5 },
			{ ...DEFAULT_PROVIDERS[0], sortOrder: 2 }
		];
		const normalized = normalizeProviderOrder(providers);
		expect(normalized.map((p) => p.sortOrder)).toEqual([0, 1]);
		expect(getEnabledProviders(providers).map((p) => p.id)).toEqual(['chatgpt']);
	});
});
