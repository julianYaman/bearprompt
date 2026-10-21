import type { DecisionQuestion, DecisionSpec, SampleAnswer } from './types';

export const DECISION_PROMPT_KIND = 'decision-spec';
export const DECISION_PROMPT_VERSION = 1;

export type DecisionPromptBody = {
	kind: typeof DECISION_PROMPT_KIND;
	version: typeof DECISION_PROMPT_VERSION;
	packSlug: string;
	recommendedModel?: string;
	questions: DecisionQuestion[];
	sampleState: unknown;
	sampleAnswers: Record<string, SampleAnswer>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isQuestion(value: unknown): value is DecisionQuestion {
	if (!isRecord(value)) return false;
	if (typeof value.name !== 'string' || typeof value.instructions !== 'string') return false;
	if (value.type === 'noul') return true;
	if (value.type === 'choice') {
		return isRecord(value.criteria) && Object.values(value.criteria).every((entry) => typeof entry === 'string');
	}
	if (value.type === 'score') {
		return Array.isArray(value.criteria) && value.criteria.every((entry) => typeof entry === 'string');
	}
	return false;
}

function isSampleAnswer(value: unknown): value is SampleAnswer {
	if (!isRecord(value)) return false;
	if (value.type === 'noul') return typeof value.noul === 'number';
	if (value.type === 'choice') {
		return (
			typeof value.choice === 'string' &&
			typeof value.confidence === 'number' &&
			isRecord(value.probabilities) &&
			Object.values(value.probabilities).every((entry) => typeof entry === 'number')
		);
	}
	if (value.type === 'score') {
		return (
			typeof value.score === 'number' &&
			typeof value.confidence === 'number' &&
			isRecord(value.probabilities) &&
			Object.values(value.probabilities).every((entry) => typeof entry === 'number')
		);
	}
	return false;
}

export function serializeDecisionPrompt(spec: DecisionSpec): string {
	const body: DecisionPromptBody = {
		kind: DECISION_PROMPT_KIND,
		version: DECISION_PROMPT_VERSION,
		packSlug: spec.packSlug,
		...(spec.recommendedModel ? { recommendedModel: spec.recommendedModel } : {}),
		questions: spec.questions,
		sampleState: spec.sampleState,
		sampleAnswers: spec.sampleAnswers
	};
	return JSON.stringify(body);
}

export function parseDecisionPrompt(raw: string): DecisionPromptBody | null {
	try {
		const parsed: unknown = JSON.parse(raw);
		if (!isRecord(parsed)) return null;
		if (parsed.kind !== DECISION_PROMPT_KIND || parsed.version !== DECISION_PROMPT_VERSION) {
			return null;
		}
		if (typeof parsed.packSlug !== 'string' || parsed.packSlug.length === 0) return null;
		if (!Array.isArray(parsed.questions) || !parsed.questions.every(isQuestion)) return null;
		if (!isRecord(parsed.sampleAnswers)) return null;

		const sampleAnswers: Record<string, SampleAnswer> = {};
		for (const [name, answer] of Object.entries(parsed.sampleAnswers)) {
			if (!isSampleAnswer(answer)) return null;
			sampleAnswers[name] = answer;
		}

		return {
			kind: DECISION_PROMPT_KIND,
			version: DECISION_PROMPT_VERSION,
			packSlug: parsed.packSlug,
			recommendedModel:
				typeof parsed.recommendedModel === 'string' ? parsed.recommendedModel : undefined,
			questions: parsed.questions,
			sampleState: parsed.sampleState,
			sampleAnswers
		};
	} catch {
		return null;
	}
}
