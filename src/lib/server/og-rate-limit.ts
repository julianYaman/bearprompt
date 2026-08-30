import { error, type RequestEvent } from '@sveltejs/kit';
import { createFixedWindowLimiter } from './rate-limit';

const ogLimiter = createFixedWindowLimiter({
	windowMs: 60_000,
	max: 40,
	maxKeys: 20_000
});

export function enforceOgRateLimit(event: Pick<RequestEvent, 'getClientAddress'>): void {
	const result = ogLimiter.hit(event.getClientAddress());
	if (!result.allowed) {
		throw error(429, 'Too many requests');
	}
}
