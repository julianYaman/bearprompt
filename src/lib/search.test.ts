import { describe, expect, it } from 'vitest';
import {
	MAX_SEARCH_LENGTH,
	buildPromptSearchOrFilter,
	escapePostgrestQuotedValue,
	normalizeSearchQuery
} from './search';

describe('normalizeSearchQuery', () => {
	it('trims and caps length', () => {
		expect(normalizeSearchQuery('  hello  ')).toBe('hello');
		expect(normalizeSearchQuery('x'.repeat(MAX_SEARCH_LENGTH + 20))).toHaveLength(MAX_SEARCH_LENGTH);
	});
});

describe('escapePostgrestQuotedValue', () => {
	it('wraps values in double quotes and escapes quotes and backslashes', () => {
		expect(escapePostgrestQuotedValue('hello')).toBe('"hello"');
		expect(escapePostgrestQuotedValue('a"b')).toBe('"a""b"');
		expect(escapePostgrestQuotedValue('a\\b')).toBe('"a\\\\b"');
	});
});

describe('buildPromptSearchOrFilter', () => {
	it('quotes the ilike pattern so commas cannot add extra filters', () => {
		expect(buildPromptSearchOrFilter('foo,id.eq.1')).toBe(
			'title.ilike."%foo,id.eq.1%",description.ilike."%foo,id.eq.1%",prompt.ilike."%foo,id.eq.1%"'
		);
	});
});
