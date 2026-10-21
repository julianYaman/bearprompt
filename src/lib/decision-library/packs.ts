import type { DecisionPack } from './types';

export const AA_DECISION_INDEX_URL =
	'https://artificialanalysis.ai/evaluations/artificial-analysis-decision-index';

export const DECISION_PACKS: DecisionPack[] = [
	{
		slug: 'd1-ultra',
		name: 'd1-ultra',
		description:
			'Usage examples from Liquid’s d1 docs: noul, choice, score, and combining all three. Same questions and sample answers as the docs. Calls use `d1-ultra`.',
		authorSlug: 'liquid-ai',
		defaultModel: 'd1-ultra',
		sourceUrl: 'https://docs.liquid.ai/lfm/models/d1',
		setupUrl: 'https://docs.liquid.ai/lfm/models/d1',
		setupLabel: 'How to run d1-ultra',
		color: '#2563eb',
		newUntil: '2026-11-08T00:00:00.000Z',
		sortOrder: 2000,
		aaIndexUrl: AA_DECISION_INDEX_URL
	},
	{
		slug: 'jev',
		name: 'Jev',
		description:
			'Usage examples from TypeSafe’s primitives docs. The pack tracks Jev, not a version pin; examples call `jev-latest`.',
		authorSlug: 'typesafe',
		defaultModel: 'jev-latest',
		sourceUrl: 'https://docs.typesafe.ai/primitives',
		setupUrl: 'https://docs.typesafe.ai/primitives',
		setupLabel: 'How to run Jev',
		color: '#c2410c',
		newUntil: '2026-11-08T00:00:00.000Z',
		sortOrder: 2001,
		aaIndexUrl: AA_DECISION_INDEX_URL
	}
];
