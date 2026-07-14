/**
 * Supabase client factory.
 *
 * Supabase is the authoritative store for skill vote counts and feedback. It is
 * OPTIONAL: when the env vars are unset (e.g. local dev without a backend, or a
 * preview build) `getSupabase()` returns null and callers degrade gracefully —
 * vote counts read as 0 and writes are disabled. This keeps the "site always
 * builds without env" rule.
 *
 * The anon key is safe to use server-side here: all writes go through
 * SECURITY DEFINER RPCs (`cast_vote`, `submit_feedback`) and reads go through a
 * read-only view, all guarded by RLS. See `supabase/schema.sql`.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  cached =
    url && anonKey
      ? createClient(url, anonKey, { auth: { persistSession: false } })
      : null;
  return cached;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
