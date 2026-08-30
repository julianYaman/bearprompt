export interface RateLimitResult {
	allowed: boolean;
	count: number;
}

export function createFixedWindowLimiter(options: {
	windowMs: number;
	max: number;
	maxKeys?: number;
}) {
	const maxKeys = options.maxKeys ?? 10_000;
	const buckets = new Map<string, number[]>();

	function prune(key: string, now: number): number[] {
		const next = (buckets.get(key) || []).filter((timestamp) => now - timestamp <= options.windowMs);
		if (next.length === 0) {
			buckets.delete(key);
			return [];
		}
		buckets.set(key, next);
		return next;
	}

	function evictOverflow() {
		while (buckets.size > maxKeys) {
			const oldest = buckets.keys().next().value;
			if (oldest === undefined) break;
			buckets.delete(oldest);
		}
	}

	return {
		inspect(key: string, now = Date.now()): RateLimitResult {
			const timestamps = prune(key, now);
			return { allowed: timestamps.length < options.max, count: timestamps.length };
		},
		hit(key: string, now = Date.now()): RateLimitResult {
			const timestamps = prune(key, now);
			if (timestamps.length >= options.max) {
				return { allowed: false, count: timestamps.length };
			}
			timestamps.push(now);
			buckets.set(key, timestamps);
			evictOverflow();
			return { allowed: true, count: timestamps.length };
		},
		size() {
			return buckets.size;
		}
	};
}
