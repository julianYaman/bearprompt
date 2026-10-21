export type QuestionType = 'noul' | 'choice' | 'score';

export type DecisionAuthorIcon = 'liquid' | 'typesafe';

export type DecisionAuthor = {
	name: string;
	slug: string;
	verified: true;
	link: string;
	publicDescription: string;
	modelFamily: readonly string[];
	icon: DecisionAuthorIcon;
};

export type NoulQuestion = {
	name: string;
	type: 'noul';
	instructions: string;
};

export type ChoiceQuestion = {
	name: string;
	type: 'choice';
	instructions: string;
	criteria: Record<string, string>;
};

export type ScoreQuestion = {
	name: string;
	type: 'score';
	instructions: string;
	criteria: string[];
};

export type DecisionQuestion = NoulQuestion | ChoiceQuestion | ScoreQuestion;

export type NoulSampleAnswer = {
	type: 'noul';
	noul: number;
};

export type ChoiceSampleAnswer = {
	type: 'choice';
	choice: string;
	probabilities: Record<string, number>;
	confidence: number;
};

export type ScoreSampleAnswer = {
	type: 'score';
	score: number;
	probabilities: Record<string, number>;
	confidence: number;
};

export type SampleAnswer = NoulSampleAnswer | ChoiceSampleAnswer | ScoreSampleAnswer;

export type DecisionSpec = {
	slug: string;
	title: string;
	description: string;
	packSlug: string;
	authorSlug: string;
	recommendedModel?: string;
	tags: string[];
	questions: DecisionQuestion[];
	sampleState: unknown;
	sampleAnswers: Record<string, SampleAnswer>;
	nextSteps: string;
};

export type DecisionPack = {
	slug: string;
	name: string;
	description: string;
	authorSlug: string;
	defaultModel: string;
	sourceUrl: string;
	setupUrl: string;
	setupLabel: string;
	color: string;
	newUntil: string;
	sortOrder: number;
	aaIndexUrl: string;
};

export type ResolvedDecisionSpec = DecisionSpec & {
	recommendedModel: string;
	author: DecisionAuthor;
	pack: DecisionPack;
};
