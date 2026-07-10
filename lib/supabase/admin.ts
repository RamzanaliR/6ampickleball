import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for admin-only server actions that need to
 * manage auth users directly (e.g. creating a member account on someone's
 * behalf). This bypasses RLS entirely.
 *
 * CRITICAL: never import this into a Client Component, never expose
 * SUPABASE_SERVICE_ROLE_KEY with a NEXT_PUBLIC_ prefix, and always verify
 * the caller is an admin (via the normal session-based client) before
 * using it — this client has no concept of "who's asking".
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
