import { getDecisionPack } from './catalog';
import { parseDecisionPrompt } from './serialize';
import type { DecisionSpec } from './types';
import type { PublicPrompt } from '$lib/types/public';

function packTagNames(): Set<string> {
	return new Set(
		['d1-ultra', 'jev', 'Jev'].map((name) => name.toLowerCase())
	);
}

export function specFromPrompt(prompt: PublicPrompt): DecisionSpec | null {
	const body = parseDecisionPrompt(prompt.prompt);
	if (!body) return null;

	const pack = getDecisionPack(body.packSlug);
	if (!pack) return null;

	const reserved = packTagNames();
	const tags = prompt.tags
		.map((tag) => tag.name)
		.filter((name) => !reserved.has(name.toLowerCase()));

	return {
		slug: prompt.slug,
		title: prompt.title,
		description: prompt.description ?? '',
		packSlug: body.packSlug,
		authorSlug: pack.authorSlug,
		recommendedModel: body.recommendedModel,
		tags: tags.length > 0 ? tags : [],
		questions: body.questions,
		sampleState: body.sampleState,
		sampleAnswers: body.sampleAnswers,
		nextSteps: prompt.additional_information ?? ''
	};
}

export function specsFromPrompts(prompts: PublicPrompt[]): DecisionSpec[] {
	return prompts
		.map(specFromPrompt)
		.filter((spec): spec is DecisionSpec => spec !== null);
}
