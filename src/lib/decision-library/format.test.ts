import { describe, expect, it } from 'vitest';
import { formatPercent, formatScore, questionTypeLabel } from './format';

describe('decision format', () => {
	it('formats probabilities as percents', () => {
		expect(formatPercent(0.97)).toBe('97%');
		expect(formatPercent(0.411)).toBe('41.1%');
	});

	it('formats scores without trailing zeros on integers', () => {
		expect(formatScore(3)).toBe('3');
		expect(formatScore(2.71)).toBe('2.71');
	});

	it('labels question types', () => {
		expect(questionTypeLabel('noul')).toBe('Noul');
		expect(questionTypeLabel('choice')).toBe('Choice');
		expect(questionTypeLabel('score')).toBe('Score');
	});
});
