import { describe, expect, it } from 'vitest';
import { D1_ULTRA_SPECS } from './specs-d1-ultra';
import { JEV_SPECS } from './specs-jev';
import {
	getDecisionSpec,
	listDecisionPacks,
	listPackCategories,
	packAsCategory,
	listResolvedSpecs,
	resolveSpec,
	searchDecisionSpecs
} from './catalog';

describe('decision catalog', () => {
	it('ships two vendor packs with inherited default models', () => {
		const packs = listDecisionPacks();
		expect(packs.map((pack) => pack.slug)).toEqual(['d1-ultra', 'jev']);

		const specs = listResolvedSpecs();
		expect(specs.some((spec) => spec.recommendedModel === 'd1-ultra')).toBe(true);
		expect(specs.some((spec) => spec.recommendedModel === 'jev-latest')).toBe(true);
		expect(specs.every((spec) => spec.author.modelFamily.includes(spec.recommendedModel))).toBe(
			true
		);
	});

	it('keeps published answers aligned with their questions', () => {
		for (const spec of [...D1_ULTRA_SPECS, ...JEV_SPECS]) {
			const names = new Set(spec.questions.map((question) => question.name));
			for (const [name, answer] of Object.entries(spec.sampleAnswers)) {
				expect(names.has(name)).toBe(true);
				expect(answer.type).toBe(spec.questions.find((question) => question.name === name)?.type);
			}
			expect(() => resolveSpec(spec)).not.toThrow();
		}
	});

	it('resolves an example by author and slug', () => {
		const spec = getDecisionSpec('liquid-ai', 'noul-harmful-message');
		expect(spec?.pack.name).toBe('d1-ultra');
		expect(spec?.recommendedModel).toBe('d1-ultra');
	});

	it('maps packs onto category cards under /decisions', () => {
		const categories = listPackCategories();
		expect(categories[0]?.externalUrl).toBe('/decisions/category/d1-ultra');
		expect(categories[0]?.promptCount).toBeGreaterThan(0);
		expect(categories.map((category) => category.icon_key)).toEqual(['liquid', 'typesafe']);
	});

	it('prefers Supabase category colors on pack cards', () => {
		const pack = listDecisionPacks().find((entry) => entry.slug === 'jev');
		if (!pack) throw new Error('missing pack');
		const category = packAsCategory(pack, 4, {
			id: 'db-jev',
			slug: pack.slug,
			name: pack.name,
			description: pack.description,
			color: '#E551BA',
			color_light: '#E551BA',
			color_dark: '#F9A8D4'
		});
		expect(category.color).toBe('#E551BA');
		expect(category.color_light).toBe('#E551BA');
		expect(category.color_dark).toBe('#F9A8D4');
		expect(category.icon_key).toBe('typesafe');
	});

	it('searches titles and question instructions', () => {
		const hits = searchDecisionSpecs('harmful, threatening');
		expect(hits.map((spec) => spec.slug)).toContain('noul-harmful-message');
	});
});
