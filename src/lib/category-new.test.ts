import { describe, expect, it } from 'vitest';
import { isCategoryNew } from './category-new';

describe('isCategoryNew', () => {
	const now = new Date('2026-10-06T12:00:00.000Z');

	it('is true when new_until is in the future', () => {
		expect(isCategoryNew({ new_until: '2026-10-07T12:00:00.000Z' }, now)).toBe(true);
	});

	it('is false when new_until is in the past', () => {
		expect(isCategoryNew({ new_until: '2026-10-05T12:00:00.000Z' }, now)).toBe(false);
	});

	it('is false when new_until is missing or invalid', () => {
		expect(isCategoryNew({}, now)).toBe(false);
		expect(isCategoryNew({ new_until: null }, now)).toBe(false);
		expect(isCategoryNew({ new_until: 'not-a-date' }, now)).toBe(false);
	});
});
