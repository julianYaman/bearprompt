import type { DecisionAuthor } from './types';

export const DECISION_AUTHORS: DecisionAuthor[] = [
	{
		name: 'Liquid AI',
		slug: 'liquid-ai',
		verified: true,
		link: 'https://docs.liquid.ai/lfm/models/d1',
		publicDescription:
			'Vendor author for Liquid decision models. Packs use the d1 family (`d1`, `d1-ultra`).',
		modelFamily: ['d1', 'd1-ultra'],
		icon: 'liquid'
	},
	{
		name: 'TypeSafe',
		slug: 'typesafe',
		verified: true,
		link: 'https://docs.typesafe.ai/primitives',
		publicDescription:
			'Vendor author for Jev. The pack is Jev, not a versioned release; generated calls use the `jev-latest` alias.',
		modelFamily: ['jev-latest', 'jev-preview', 'jev-1.14.0'],
		icon: 'typesafe'
	}
];
