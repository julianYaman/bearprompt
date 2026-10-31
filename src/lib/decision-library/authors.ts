import type { DecisionAuthor } from './types';

export const DECISION_AUTHOR_AVATARS = {
	'liquid-ai': 'https://img.logo.dev/liquid.ai?token=pk_Ss1kqMCwRdC9gAGPgJ4RTw&retina=true',
	typesafe: 'https://img.logo.dev/typesafe.ai?token=pk_Ss1kqMCwRdC9gAGPgJ4RTw&retina=true'
} as const;

export const DECISION_AUTHORS: DecisionAuthor[] = [
	{
		name: 'Liquid AI',
		slug: 'liquid-ai',
		verified: true,
		link: 'https://docs.liquid.ai/lfm/models/d1',
		publicDescription:
			'Vendor author for Liquid decision models. Packs use the d1 family (`d1`, `d1-ultra`).',
		modelFamily: ['d1', 'd1-ultra'],
		avatarUrl: DECISION_AUTHOR_AVATARS['liquid-ai']
	},
	{
		name: 'TypeSafe',
		slug: 'typesafe',
		verified: true,
		link: 'https://docs.typesafe.ai/primitives',
		publicDescription:
			'Vendor author for Jev. The pack is Jev, not a versioned release; generated calls use the `jev-latest` alias.',
		modelFamily: ['jev-latest', 'jev-preview', 'jev-1.14.0'],
		avatarUrl: DECISION_AUTHOR_AVATARS.typesafe
	}
];
