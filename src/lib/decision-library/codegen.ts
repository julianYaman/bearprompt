import type {
	ChoiceQuestion,
	DecisionPack,
	DecisionQuestion,
	DecisionSpec,
	ScoreQuestion
} from './types';

export type DecisionCodeLanguage = 'python' | 'typescript' | 'json';

function pythonString(value: string): string {
	return JSON.stringify(value);
}

function indentBlock(value: string, spaces: number): string {
	const pad = ' '.repeat(spaces);
	return value
		.split('\n')
		.map((line) => (line.length > 0 ? `${pad}${line}` : line))
		.join('\n');
}

function pythonValue(value: unknown): string {
	if (typeof value === 'string') return pythonString(value);
	if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
		return JSON.stringify(value);
	}
	if (Array.isArray(value)) {
		if (value.length === 0) return '[]';
		const inner = value.map((entry) => pythonValue(entry)).join(',\n');
		return `[\n${indentBlock(inner, 4)}\n]`;
	}
	if (value && typeof value === 'object') {
		const entries = Object.entries(value);
		if (entries.length === 0) return '{}';
		const inner = entries
			.map(([key, entry]) => `${pythonString(key)}: ${pythonValue(entry)}`)
			.join(',\n');
		return `{\n${indentBlock(inner, 4)}\n}`;
	}
	return pythonString(String(value));
}

function tsValue(value: unknown): string {
	return JSON.stringify(value, null, 2);
}

function pythonQuestion(question: DecisionQuestion): string {
	if (question.type === 'noul') {
		return `${pythonString(question.name)}: Noul(\n    instructions=${pythonString(question.instructions)},\n)`;
	}
	if (question.type === 'choice') {
		return `${pythonString(question.name)}: Choice(\n    instructions=${pythonString(question.instructions)},\n    criteria=${pythonValue((question as ChoiceQuestion).criteria)},\n)`;
	}
	return `${pythonString(question.name)}: Score(\n    instructions=${pythonString(question.instructions)},\n    criteria=${pythonValue((question as ScoreQuestion).criteria)},\n)`;
}

function tsQuestion(question: DecisionQuestion): string {
	if (question.type === 'noul') {
		return `${question.name}: {\n  type: "noul",\n  instructions: ${JSON.stringify(question.instructions)},\n}`;
	}
	if (question.type === 'choice') {
		return `${question.name}: {\n  type: "choice",\n  instructions: ${JSON.stringify(question.instructions)},\n  criteria: ${tsValue((question as ChoiceQuestion).criteria)},\n}`;
	}
	return `${question.name}: {\n  type: "score",\n  instructions: ${JSON.stringify(question.instructions)},\n  criteria: ${tsValue((question as ScoreQuestion).criteria)},\n}`;
}

function requestBody(spec: DecisionSpec, model: string): Record<string, unknown> {
	const questions: Record<string, unknown> = {};
	for (const question of spec.questions) {
		if (question.type === 'noul') {
			questions[question.name] = {
				type: 'noul',
				instructions: question.instructions
			};
		} else if (question.type === 'choice') {
			questions[question.name] = {
				type: 'choice',
				instructions: question.instructions,
				criteria: question.criteria
			};
		} else {
			questions[question.name] = {
				type: 'score',
				instructions: question.instructions,
				criteria: question.criteria
			};
		}
	}

	return {
		model,
		state: spec.sampleState,
		questions
	};
}

function pythonForLiquid(spec: DecisionSpec, model: string): string {
	const questions = spec.questions.map(pythonQuestion).join(',\n');
	return `import os
from typesafe_sdk import Choice, Noul, Score, TypeSafeClient

client = TypeSafeClient(
    api_key=os.environ["LIQUID_API_KEY"],
    base_url="https://api.liquid.ai",
)

result = client.system_one(
    model=${pythonString(model)},
    state=${pythonValue(spec.sampleState)},
    questions={
${indentBlock(questions, 8)}
    },
)
`;
}

function pythonForTypesafe(spec: DecisionSpec, model: string): string {
	const questions = spec.questions.map(pythonQuestion).join(',\n');
	return `from typesafe_sdk import Choice, Noul, Score, TypeSafeClient

with TypeSafeClient(model=${pythonString(model)}) as client:
    result = client.system_one(
        state=${pythonValue(spec.sampleState)},
        questions={
${indentBlock(questions, 12)}
        },
    )
`;
}

function typescriptForLiquid(spec: DecisionSpec, model: string): string {
	const questions = spec.questions.map(tsQuestion).join(',\n');
	return `import { TypeSafeClient } from "@typesafe-ai/sdk";

const client = new TypeSafeClient({
  apiKey: process.env.LIQUID_API_KEY!,
  baseURL: "https://api.liquid.ai",
  compression: false,
});

const result = await client.systemOne({
  model: ${JSON.stringify(model)},
  state: ${tsValue(spec.sampleState)},
  questions: {
${indentBlock(questions, 4)}
  },
});
`;
}

function typescriptForTypesafe(spec: DecisionSpec, model: string): string {
	const questions = spec.questions.map(tsQuestion).join(',\n');
	return `import { TypeSafeClient } from "@typesafe-ai/sdk";

const client = new TypeSafeClient({
  model: ${JSON.stringify(model)},
});

const result = await client.systemOne({
  state: ${tsValue(spec.sampleState)},
  questions: {
${indentBlock(questions, 4)}
  },
});
`;
}

export function generateDecisionCode(
	spec: DecisionSpec,
	pack: DecisionPack,
	language: DecisionCodeLanguage,
	model: string
): string {
	if (language === 'json') {
		return `${JSON.stringify(requestBody(spec, model), null, 2)}\n`;
	}

	const isLiquid = pack.authorSlug === 'liquid-ai';
	if (language === 'python') {
		return isLiquid ? pythonForLiquid(spec, model) : pythonForTypesafe(spec, model);
	}
	return isLiquid ? typescriptForLiquid(spec, model) : typescriptForTypesafe(spec, model);
}
