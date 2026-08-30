import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

const SERVER_AUTH_OPTIONS = {
	auth: {
		persistSession: false,
		autoRefreshToken: false,
		detectSessionInUrl: false
	}
} as const;

let anonClient: SupabaseClient | null = null;
let serviceClient: SupabaseClient | null = null;

export function getSupabase() {
	if (anonClient) return anonClient;

	if (!env.SUPABASE_URL) {
		throw new Error('SUPABASE_URL is missing');
	}
	if (!env.SUPABASE_ANON_KEY) {
		throw new Error('SUPABASE_ANON_KEY is missing');
	}

	anonClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, SERVER_AUTH_OPTIONS);
	return anonClient;
}

export function getSupabaseService() {
	if (serviceClient) return serviceClient;

	if (!env.SUPABASE_URL) {
		throw new Error('SUPABASE_URL is missing');
	}
	if (!env.SUPABASE_SERVICE_ROLE_KEY) {
		throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing');
	}
	if (env.SUPABASE_SERVICE_ROLE_KEY.startsWith('sb_publishable_')) {
		throw new Error('SUPABASE_SERVICE_ROLE_KEY is invalid (publishable key provided)');
	}

	serviceClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, SERVER_AUTH_OPTIONS);
	return serviceClient;
}
