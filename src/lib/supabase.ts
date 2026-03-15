import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

export function getSupabase() {
	if (!env.SUPABASE_URL) {
		throw new Error('SUPABASE_URL is missing');
	}
	if (!env.SUPABASE_ANON_KEY) {
		throw new Error('SUPABASE_ANON_KEY is missing');
	}

	return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
}

export function getSupabaseService() {
	if (!env.SUPABASE_URL) {
		throw new Error('SUPABASE_URL is missing');
	}
	if (!env.SUPABASE_SERVICE_ROLE_KEY) {
		throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing');
	}
	if (env.SUPABASE_SERVICE_ROLE_KEY.startsWith('sb_publishable_')) {
		throw new Error('SUPABASE_SERVICE_ROLE_KEY is invalid (publishable key provided)');
	}

	return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
		auth: {
			persistSession: false,
			autoRefreshToken: false
		}
	});
}
