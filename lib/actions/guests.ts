"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AddGuestState = { error?: string };

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
  revalidatePath("/sessions");
  return {};
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
  if (me?.role !== "admin") return { error: "Admins only" };

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
