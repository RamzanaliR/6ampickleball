"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AddGuestState = { error?: string; success?: boolean };

export async function addGuestToSession(
  sessionId: string,
  _prevState: AddGuestState,
  formData: FormData
): Promise<AddGuestState> {
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const existingGuestId = String(formData.get("existing_guest_id") ?? "").trim();

  if (!existingGuestId && !name) {
    return { error: "Enter a name, or pick a returning guest." };
  }

  const { error } = await supabase.rpc("add_guest_to_session", {
    p_session_id: sessionId,
    p_name: existingGuestId ? null : name,
    p_existing_guest_id: existingGuestId || null,
  });

  if (error) return { error: error.message };

  revalidatePath(`/admin/sessions/${sessionId}/no-shows`);
  revalidatePath(`/admin/sessions/${sessionId}/fixtures`);
  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath("/sessions");
  return { success: true };
}

export type AddGuestNamesState = { error?: string; addedCount?: number };

/**
 * Adds one or more guests to a session from a plain list of names
 * (as typed into a comma-separated field). Each name is matched
 * case-insensitively against known guests; a match reuses that
 * guest, otherwise a new guest is created — same underlying RPC as
 * addGuestToSession above, just looped over a batch of names.
 */
export async function addGuestNamesToSession(
  sessionId: string,
  names: string[]
): Promise<AddGuestNamesState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: me } = await supabase
    .from("players")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin" && me?.role !== "manager") {
    return { error: "Admins and managers only" };
  }

  const cleaned = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  if (cleaned.length === 0) return { error: "Enter at least one name." };

  const { data: existingGuests } = await supabase
    .from("players")
    .select("id, name")
    .eq("is_guest", true)
    .eq("status", "approved");

  const existingIdByLowerName = new Map(
    (existingGuests ?? []).map((g) => [g.name.trim().toLowerCase(), g.id])
  );

  for (const name of cleaned) {
    const existingId = existingIdByLowerName.get(name.toLowerCase());
    const { error } = await supabase.rpc("add_guest_to_session", {
      p_session_id: sessionId,
      p_name: existingId ? null : name,
      p_existing_guest_id: existingId ?? null,
    });
    if (error) return { error: `${name}: ${error.message}` };
  }

  revalidatePath(`/admin/sessions/${sessionId}/no-shows`);
  revalidatePath(`/admin/sessions/${sessionId}/fixtures`);
  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath("/sessions");
  return { addedCount: cleaned.length };
}

export type AddMemberToSessionState = { error?: string };

/**
 * Directly confirms an existing approved member for a session, as if
 * they'd RSVP'd themselves — for the transition period where some
 * confirmations still happen over WhatsApp instead of in the app.
 * Bypasses capacity/waitlist since this is an intentional admin
 * override, not a self-serve RSVP.
 */
export async function addMemberToSession(
  sessionId: string,
  _prevState: AddMemberToSessionState,
  formData: FormData
): Promise<AddMemberToSessionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: me } = await supabase
    .from("players")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin" && me?.role !== "manager") {
    return { error: "Admins and managers only" };
  }

  const playerId = String(formData.get("player_id") ?? "").trim();
  if (!playerId) return { error: "Pick a member." };

  const { error } = await supabase
    .from("rsvps")
    .upsert(
      { player_id: playerId, session_id: sessionId, status: "confirmed" },
      { onConflict: "player_id,session_id" }
    );
  if (error) return { error: error.message };

  revalidatePath(`/admin/sessions/${sessionId}/no-shows`);
  revalidatePath(`/admin/sessions/${sessionId}/fixtures`);
  revalidatePath("/sessions");
  return {};
}
