export type PromptVariable = {
	name: string;
	type: 'text' | 'select' | 'textarea';
	options?: string[];
};

export type PromptPreviewToken =
	| { type: 'text'; value: string }
	| { type: 'variable'; name: string; placeholder: string; value: string };

const VARIABLE_PATTERN =
	/\{\{\s*([A-Za-z0-9_-]+)\s*(?::\s*(select|textarea)\s*(?:\(([^{}()]*)\))?)?(?:\(([^{}()]*)\))?\s*\}\}/g;

function parseOptions(rawOptions: string | undefined): string[] | undefined {
	if (rawOptions === undefined) return undefined;

	const options = rawOptions
		.split('|')
		.map((option) => option.trim())
		.filter(Boolean);

	return options.length > 0 ? options : undefined;
}

function toVariable(
	name: string,
	type: string | undefined,
	rawTypedOptions: string | undefined,
	rawLegacyOptions: string | undefined
): PromptVariable {
	const typedOptions = parseOptions(rawTypedOptions);
	const legacyOptions = parseOptions(rawLegacyOptions);

	if (type === 'textarea') {
		return {
			name,
			type: 'textarea'
		};
	}

	if (type === 'select') {
		return {
			name,
			type: 'select',
			options: typedOptions ?? []
		};
	}

	if (legacyOptions) {
		return {
			name,
			type: 'select',
			options: legacyOptions
		};
	}

	return {
		name,
		type: 'text'
	};
}

function variablePriority(variable: PromptVariable): number {
	if (variable.type === 'select') return 2;
	if (variable.type === 'textarea') return 1;
	return 0;
}

export function parsePromptVariables(prompt: string): PromptVariable[] {
	const variables: PromptVariable[] = [];
	const indexes = new Map<string, number>();

	for (const match of prompt.matchAll(VARIABLE_PATTERN)) {
		const name = match[1].trim();
		const variable = toVariable(name, match[2], match[3], match[4]);
		const existingIndex = indexes.get(name);

		if (existingIndex === undefined) {
			indexes.set(name, variables.length);
			variables.push(variable);
			continue;
		}

		const existing = variables[existingIndex];
		if (variablePriority(variable) > variablePriority(existing)) {
			variables[existingIndex] = variable;
		}
	}

	return variables;
}

export function hasPromptVariables(prompt: string): boolean {
	return parsePromptVariables(prompt).length > 0;
}

export function renderPrompt(prompt: string, values: Record<string, string>): string {
	return prompt.replace(VARIABLE_PATTERN, (placeholder: string, name: string) => {
		const value = values[name];
		return value ? value : placeholder;
	});
}

export function formatVariableLabel(name: string): string {
	const label = name.replace(/_/g, ' ');
	return label ? label[0].toUpperCase() + label.slice(1) : label;
}

export function tokenizePromptForPreview(
	prompt: string,
	values: Record<string, string>
): PromptPreviewToken[] {
	const tokens: PromptPreviewToken[] = [];
	let lastIndex = 0;

	for (const match of prompt.matchAll(VARIABLE_PATTERN)) {
		const placeholder = match[0];
		const name = match[1].trim();
		const index = match.index ?? 0;

		if (index > lastIndex) {
			tokens.push({
				type: 'text',
				value: prompt.slice(lastIndex, index)
			});
		}

		tokens.push({
			type: 'variable',
			name,
			placeholder,
			value: values[name] || ''
		});

		lastIndex = index + placeholder.length;
	}

	if (lastIndex < prompt.length) {
		tokens.push({
			type: 'text',
			value: prompt.slice(lastIndex)
		});
	}

	return tokens;
}
