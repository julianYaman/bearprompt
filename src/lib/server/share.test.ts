import { describe, expect, it } from 'vitest';
import { evaluateRateLimit, registerRateLimitedRequest } from './share';

describe('share rate limit', () => {
	it('requires captcha after the soft limit', () => {
		const ip = `soft-${crypto.randomUUID()}`;
		for (let index = 0; index < 5; index += 1) {
			registerRateLimitedRequest(ip);
		}
		expect(evaluateRateLimit(ip)).toEqual({ allowed: true, requiresCaptcha: true });
	});

	it('blocks after the hard limit', () => {
		const ip = `hard-${crypto.randomUUID()}`;
		for (let index = 0; index < 20; index += 1) {
			registerRateLimitedRequest(ip);
		}
		expect(evaluateRateLimit(ip)).toEqual({ allowed: false, requiresCaptcha: true });
	});
});
