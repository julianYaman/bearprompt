import { describe, expect, it } from 'vitest';
import { createFixedWindowLimiter } from './rate-limit';

describe('createFixedWindowLimiter', () => {
	it('allows hits under the max and blocks after', () => {
		const limiter = createFixedWindowLimiter({ windowMs: 1000, max: 2 });
		expect(limiter.hit('ip', 0).allowed).toBe(true);
		expect(limiter.hit('ip', 1).allowed).toBe(true);
		expect(limiter.hit('ip', 2).allowed).toBe(false);
	});

	it('drops empty buckets after the window elapses', () => {
		const limiter = createFixedWindowLimiter({ windowMs: 10, max: 5 });
		limiter.hit('ip', 0);
		expect(limiter.size()).toBe(1);
		limiter.inspect('ip', 11);
		expect(limiter.size()).toBe(0);
	});

	it('caps the number of tracked keys', () => {
		const limiter = createFixedWindowLimiter({ windowMs: 1000, max: 5, maxKeys: 2 });
		limiter.hit('a', 0);
		limiter.hit('b', 0);
		limiter.hit('c', 0);
		expect(limiter.size()).toBe(2);
	});
});
