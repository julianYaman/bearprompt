import { json, type RequestHandler } from '@sveltejs/kit';
import { getCurrentAnnouncement } from '$lib/server/queries';
import { CACHE_CONTROL, getCachedAnnouncement } from '$lib/server/cache';
import { createFixedWindowLimiter } from '$lib/server/rate-limit';
import { getSupabase } from '$lib/supabase';

const announcementLimiter = createFixedWindowLimiter({
	windowMs: 60_000,
	max: 60,
	maxKeys: 20_000
});

export const GET: RequestHandler = async ({ setHeaders, getClientAddress }) => {
	const limited = announcementLimiter.hit(getClientAddress() || 'unknown');
	if (!limited.allowed) {
		return json({ announcement: null }, { status: 429 });
	}

	setHeaders({
		'Cache-Control': CACHE_CONTROL.ANNOUNCEMENT
	});

	try {
		const announcement = await getCachedAnnouncement(() =>
			getCurrentAnnouncement(getSupabase())
		);
		return json({ announcement });
	} catch (error) {
		console.error('Failed to load announcement:', error);
		return json({ announcement: null });
	}
};
