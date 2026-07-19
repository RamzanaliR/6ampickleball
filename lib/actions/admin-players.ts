"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
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
}

export type AddMemberFormState = {
  error?: string;
  created?: { name: string; email: string; password: string };
};

function generateTempPassword(length = 10) {
  // Excludes visually ambiguous characters (0/O, 1/l/I) since this gets
  // read off a screen and typed in by hand.
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let password = "";
  for (let i = 0; i < length; i++) {
    password += alphabet[bytes[i] % alphabet.length];
  }
  return password;
}

export async function addMember(
  _prevState: AddMemberFormState,
  formData: FormData
): Promise<AddMemberFormState> {
  const supabase = await createClient();
  try {
    await requireAdmin(supabase);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized" };
  }

  const name = String(formData.get("name") ?? "").trim();
  const nickname = String(formData.get("nickname") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!name) return { error: "Enter a name." };
  if (!email || !email.includes("@")) return { error: "Enter a valid email." };

  const password = generateTempPassword();
  const admin = createAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, nickname: nickname || undefined },
  });

  if (createError || !created.user) {
    const message = createError?.message ?? "Couldn't create the account.";
    return {
      error: message.toLowerCase().includes("already been registered")
        ? "Someone with that email already has an account."
        : message,
    };
  }

  // Skip the pending-approval queue — the admin adding this person
  // directly is the approval.
  const { error: approveError } = await admin
    .from("players")
    .update({ status: "approved" })
    .eq("id", created.user.id);

  if (approveError) {
    return { error: `Account created, but approval failed: ${approveError.message}` };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/players");
  revalidatePath("/leaderboard");

  return { created: { name, email, password } };
}

export async function approvePlayer(playerId: string) {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const { error } = await supabase
    .from("players")
    .update({ status: "approved" })
    .eq("id", playerId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath("/admin/players");
  revalidatePath("/leaderboard");
}

export async function rejectPlayer(playerId: string) {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const { error } = await supabase
    .from("players")
    .update({ status: "rejected" })
    .eq("id", playerId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath("/admin/players");
}

export type RemoveMemberResult = { mode: "deleted" | "removed" };

/**
 * Removes a member from the club. Tries a full account delete first
 * (auth.users cascades to public.players). If that's blocked — because
 * they created sessions, submitted matches, marked payments, checked
 * someone in, or posted to the feed, all of which reference players.id
 * without cascade — falls back to a soft removal (status = 'rejected')
 * so the roster/leaderboard stay clean without breaking those records.
 */
export async function removeMember(playerId: string): Promise<RemoveMemberResult> {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const admin = createAdminClient();
  const { error: deleteError } = await admin.auth.admin.deleteUser(playerId);

  let result: RemoveMemberResult;
  if (!deleteError) {
    result = { mode: "deleted" };
  } else {
    const { error: fallbackError } = await supabase
      .from("players")
      .update({ status: "rejected" })
      .eq("id", playerId);
    if (fallbackError) throw new Error(fallbackError.message);
    result = { mode: "removed" };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/players");
  revalidatePath("/leaderboard");
  return result;
}

/**
 * Removes a guest from the active guest list without touching their
 * history. Guests have no auth.users account (they're just a players
 * row), so this is always a soft removal — status = 'rejected' takes
 * them out of the "Guest players" list, but their id stays valid so
 * every match/session/payment that references them keeps working.
 */
export async function removeGuest(playerId: string) {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const { data: guest, error: fetchError } = await supabase
    .from("players")
    .select("is_guest")
    .eq("id", playerId)
    .single();
  if (fetchError) throw new Error(fetchError.message);
  if (!guest?.is_guest) throw new Error("Not a guest player");

  const { error } = await supabase
    .from("players")
    .update({ status: "rejected" })
    .eq("id", playerId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath("/admin/players");
}

/**
 * Promotes a player to admin, or demotes an admin back to a regular
 * player. Blocks demoting the last remaining admin so the club can't
 * accidentally end up with no one who can access the admin tools.
 */
export async function setAdminRole(playerId: string, makeAdmin: boolean) {
  const supabase = await createClient();
  await requireAdmin(supabase);

  if (!makeAdmin) {
    const { count } = await supabase
      .from("players")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) <= 1) {
      throw new Error("Can't remove the last remaining admin.");
    }
  }

  const { error } = await supabase
    .from("players")
    .update({ role: makeAdmin ? "admin" : "player" })
    .eq("id", playerId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/players");
}

export type UpdatePlayerDetailsState = { error?: string; success?: boolean };

/** Admin edit of a club member's own profile details. */
export async function updateMemberDetails(
  playerId: string,
  _prevState: UpdatePlayerDetailsState,
  formData: FormData
): Promise<UpdatePlayerDetailsState> {
  const supabase = await createClient();
  try {
    await requireAdmin(supabase);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized" };
  }

  const name = String(formData.get("name") ?? "").trim();
  const nickname = String(formData.get("nickname") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const duprId = String(formData.get("dupr_id") ?? "").trim();

  if (!name) return { error: "Name is required." };

  const { error } = await supabase
    .from("players")
    .update({
      name,
      nickname: nickname || null,
      phone: phone || null,
      dupr_id: duprId || null,
    })
    .eq("id", playerId);
  if (error) return { error: error.message };

  revalidatePath("/admin/players");
  revalidatePath("/leaderboard");
  revalidatePath("/feed");
  return { success: true };
}

/** Admin edit of a guest's details (name + DUPR only — guests have no account). */
export async function updateGuestDetails(
  playerId: string,
  _prevState: UpdatePlayerDetailsState,
  formData: FormData
): Promise<UpdatePlayerDetailsState> {
  const supabase = await createClient();
  try {
    await requireAdmin(supabase);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized" };
  }

  const name = String(formData.get("name") ?? "").trim();
  const duprId = String(formData.get("dupr_id") ?? "").trim();

  if (!name) return { error: "Name is required." };

  const { error } = await supabase
    .from("players")
    .update({ name, dupr_id: duprId || null })
    .eq("id", playerId)
    .eq("is_guest", true);
  if (error) return { error: error.message };

  revalidatePath("/admin/players");
  return { success: true };
}
