import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Throws if the caller isn't signed in as an admin. Use for actions that
 * must stay admin-only (finances, dues, deleting/removing people,
 * regenerating fixtures, role changes, etc).
 */
export async function requireAdminId(supabase: SupabaseServerClient): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: player } = await supabase
    .from("players")
    .select("role")
    .eq("id", user.id)
    .single();

  if (player?.role !== "admin") throw new Error("Admins only");
  return user.id;
}

/**
 * Throws if the caller isn't signed in as an admin OR manager. Use for the
 * subset of actions Managers are trusted with: creating sessions, adding
 * guests/members to a session, generating (not regenerating) fixtures,
 * flagging no-shows, and editing player details.
 */
export async function requireStaffId(supabase: SupabaseServerClient): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: player } = await supabase
    .from("players")
    .select("role")
    .eq("id", user.id)
    .single();

  if (player?.role !== "admin" && player?.role !== "manager") {
    throw new Error("Admins and managers only");
  }
  return user.id;
}
