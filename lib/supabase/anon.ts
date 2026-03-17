import { createClient } from "@supabase/supabase-js";

/**
 * A plain Supabase client that uses only the public anon key — no cookies,
 * no request context. Safe to use inside unstable_cache() callbacks, which
 * run outside the request lifecycle. Only appropriate for queries that don't
 * rely on RLS (RLS is disabled for this app; auth is enforced at the
 * middleware/layout level before any of these queries run).
 */
export function createAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
