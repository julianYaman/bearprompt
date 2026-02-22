import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

export function getSupabase() {
  if (!env.SUPABASE_URL) {
    throw new Error('SUPABASE_URL is missing');
  }
  if (!env.SUPABASE_ANON_KEY) {
    throw new Error('SUPABASE_ANON_KEY is missing');
  }

  return createClient(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY
  );
}