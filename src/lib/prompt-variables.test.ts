import { describe, expect, it } from 'vitest';
import {
	formatVariableLabel,
	hasPromptVariables,
	parsePromptVariables,
	renderPrompt,
	tokenizePromptForPreview
} from './prompt-variables';

describe('prompt variables', () => {
	it('parses text variables', () => {
		expect(parsePromptVariables('Write about {{topic}}')).toEqual([
			{ name: 'topic', type: 'text' }
		]);
	});

	it('parses select variables', () => {
		expect(parsePromptVariables('Use {{tone(formal|friendly|casual)}} tone')).toEqual([
			{ name: 'tone', type: 'select', options: ['formal', 'friendly', 'casual'] }
		]);
	});

	it('parses typed select variables', () => {
		expect(parsePromptVariables('Use {{tone:select(formal|friendly|casual)}} tone')).toEqual([
			{ name: 'tone', type: 'select', options: ['formal', 'friendly', 'casual'] }
		]);
	});

	it('parses typed select variables without options', () => {
		expect(parsePromptVariables('Use {{tone:select()}} tone')).toEqual([
			{ name: 'tone', type: 'select', options: [] }
		]);
	});

	it('parses textarea variables', () => {
		expect(parsePromptVariables('Text: {{text:textarea}}')).toEqual([
			{ name: 'text', type: 'textarea' }
		]);
	});

	it('preserves first appearance order', () => {
		expect(parsePromptVariables('{{topic}} {{tone(formal|casual)}} {{audience}}')).toEqual([
			{ name: 'topic', type: 'text' },
			{ name: 'tone', type: 'select', options: ['formal', 'casual'] },
			{ name: 'audience', type: 'text' }
		]);
	});

	it('deduplicates repeated variables', () => {
		expect(parsePromptVariables('{{topic}} and {{topic}}')).toEqual([
			{ name: 'topic', type: 'text' }
		]);
	});

	it('upgrades a repeated text variable to typed variables', () => {
		expect(parsePromptVariables('{{topic}} then {{topic:textarea}} then {{topic(news|sports)}}')).toEqual([
			{ name: 'topic', type: 'select', options: ['news', 'sports'] }
		]);
	});

	it('supports letters, numbers, underscores, and hyphens', () => {
		expect(parsePromptVariables('{{topic_1}} {{tone-style}}')).toEqual([
			{ name: 'topic_1', type: 'text' },
			{ name: 'tone-style', type: 'text' }
		]);
	});

	it('ignores malformed syntax without throwing', () => {
		expect(() => parsePromptVariables('{{topic {{bad name}} {{x(a|)}}')).not.toThrow();
		expect(hasPromptVariables('{{topic {{bad name}}')).toBe(false);
	});

	it('treats empty option lists as text', () => {
		expect(parsePromptVariables('{{tone()}}')).toEqual([{ name: 'tone', type: 'text' }]);
	});

	it('renders all repeated occurrences', () => {
		expect(renderPrompt('{{topic}} and {{topic}}', { topic: 'Svelte' })).toBe(
			'Svelte and Svelte'
		);
	});

	it('preserves unfilled placeholders exactly', () => {
		expect(renderPrompt('Use {{ tone:select(formal|friendly) }} tone', {})).toBe(
			'Use {{ tone:select(formal|friendly) }} tone'
		);
	});

	it('formats variable labels', () => {
		expect(formatVariableLabel('target_audience')).toBe('Target audience');
		expect(formatVariableLabel('tone-style')).toBe('Tone-style');
	});

	it('tokenizes prompt preview in order', () => {
		expect(tokenizePromptForPreview('Write {{topic}} for {{audience}}.', { topic: 'posts' })).toEqual([
			{ type: 'text', value: 'Write ' },
			{ type: 'variable', name: 'topic', placeholder: '{{topic}}', value: 'posts' },
			{ type: 'text', value: ' for ' },
			{ type: 'variable', name: 'audience', placeholder: '{{audience}}', value: '' },
			{ type: 'text', value: '.' }
		]);
	});
});
