import { describe, expect, it } from 'vitest';
import { D1_ULTRA_SPECS } from './specs-d1-ultra';
import { JEV_SPECS } from './specs-jev';
import { parseDecisionPrompt, serializeDecisionPrompt } from './serialize';
import { specFromPrompt } from './from-db';
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
