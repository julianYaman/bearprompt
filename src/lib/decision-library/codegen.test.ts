import { describe, expect, it } from 'vitest';
import { generateDecisionCode } from './codegen';
import { getDecisionSpec } from './catalog';

describe('generateDecisionCode', () => {
	it('emits Liquid d1-ultra in Python, TypeScript, and JSON', () => {
		const spec = getDecisionSpec('liquid-ai', 'noul-harmful-message');
		if (!spec) throw new Error('missing example');

		const python = generateDecisionCode(spec, spec.pack, 'python', spec.recommendedModel);
		expect(python).toContain('model="d1-ultra"');
		expect(python).toContain('base_url="https://api.liquid.ai"');
		expect(python).toContain('is_harmful');

		const typescript = generateDecisionCode(spec, spec.pack, 'typescript', spec.recommendedModel);
		expect(typescript).toContain('model: "d1-ultra"');
		expect(typescript).toContain('baseURL: "https://api.liquid.ai"');

		const json = generateDecisionCode(spec, spec.pack, 'json', spec.recommendedModel);
		const body = JSON.parse(json) as { model: string; questions: Record<string, { type: string }> };
		expect(body.model).toBe('d1-ultra');
		expect(body.questions.is_harmful.type).toBe('noul');
	});

	it('uses the Jev alias, not a versioned pack id', () => {
		const spec = getDecisionSpec('typesafe', 'combine-flight-refund');
		if (!spec) throw new Error('missing example');

		const python = generateDecisionCode(spec, spec.pack, 'python', spec.recommendedModel);
		expect(python).toContain('TypeSafeClient(model="jev-latest")');
		expect(python).not.toContain('liquid.ai');
		expect(python).toContain('refund_requested');
	});
});
