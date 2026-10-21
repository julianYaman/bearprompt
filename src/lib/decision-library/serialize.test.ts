import { describe, expect, it } from 'vitest';
import { D1_ULTRA_SPECS } from './specs-d1-ultra';
import { JEV_SPECS } from './specs-jev';
import { parseDecisionPrompt, serializeDecisionPrompt } from './serialize';
import { specFromPrompt } from './from-db';
import { buildDecisionLibrarySql, DECISION_PACK_SORT_ORDER_MIN } from './sql';
import type { PublicPrompt } from '$lib/types/public';

describe('decision spec serialize', () => {
	it('round-trips every shipped spec through JSON in prompts.prompt', () => {
		for (const spec of [...D1_ULTRA_SPECS, ...JEV_SPECS]) {
			const parsed = parseDecisionPrompt(serializeDecisionPrompt(spec));
			expect(parsed?.packSlug).toBe(spec.packSlug);
			expect(parsed?.questions).toEqual(spec.questions);
			expect(parsed?.sampleAnswers).toEqual(spec.sampleAnswers);
			expect(parsed?.sampleState).toEqual(spec.sampleState);
		}
	});

	it('rejects markdown and other prompt bodies', () => {
		expect(parseDecisionPrompt('You are a helpful assistant.')).toBeNull();
		expect(parseDecisionPrompt('{"kind":"prompt"}')).toBeNull();
	});

	it('rebuilds a spec from a public prompt row', () => {
		const spec = D1_ULTRA_SPECS[0];
		const prompt: PublicPrompt = {
			id: '1',
			created_at: '2026-10-18T00:00:00.000Z',
			title: spec.title,
			slug: spec.slug,
			prompt: serializeDecisionPrompt(spec),
			description: spec.description,
			additional_information: spec.nextSteps,
			author_id: '12',
			type: 'decision',
			tags: [
				{ id: '1', name: 'd1-ultra' },
				{ id: '2', name: 'noul' },
				{ id: '3', name: 'safety' }
			],
			author: {
				id: '12',
				created_at: '2026-10-18T00:00:00.000Z',
				name: 'Liquid AI',
				slug: 'liquid-ai',
				public_description: null,
				link: null,
				verified: true,
				avatar_url: null,
				highlighted: false,
				featured_color_light: null,
				featured_color_dark: null
			}
		};

		expect(specFromPrompt(prompt)).toEqual({
			...spec,
			tags: ['noul', 'safety']
		});
	});
});

describe('decision library SQL', () => {
	it('seeds authors, packs, and every spec as type=decision', () => {
		const sql = buildDecisionLibrarySql();
		expect(sql).toContain("type = 'decision'");
		expect(sql).toContain("'liquid-ai'");
		expect(sql).toContain("'typesafe'");
		expect(sql).toContain("'d1-ultra'");
		expect(sql).toContain("'jev'");
		expect(sql).toContain("'noul-harmful-message'");
		expect(sql).toContain("'combine-flight-refund'");
		expect(sql).toContain("DELETE FROM prompts WHERE type = 'decision'");
		expect(sql).toContain(`sort_order = ${DECISION_PACK_SORT_ORDER_MIN}`);
		expect(sql).toContain("icon_key = 'sparkles'");
		expect(sql).not.toContain("icon_key = 'liquid'");
		expect(sql).toContain('"tag-to-prompt"');
		expect(sql).toContain('kind');
		expect(sql).toContain('decision-spec');
	});
});
