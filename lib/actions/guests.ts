"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkSpotsThresholds } from "@/lib/notifications/session-triggers";

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

  await checkSpotsThresholds(sessionId);

  revalidatePath(`/admin/sessions/${sessionId}/no-shows`);
  revalidatePath(`/admin/sessions/${sessionId}/fixtures`);
  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath("/sessions");
  return { success: true };
}

export type SessionGuestEntry = { name: string; duprId: string | null };
export type GetSessionGuestRosterResult = { error?: string; guests?: SessionGuestEntry[] };

/** Read-only list of guests (not members) confirmed for a session — for the "View Guests" popup. */
export async function getSessionGuestRoster(sessionId: string): Promise<GetSessionGuestRosterResult> {
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

  const { data: rsvps, error } = await supabase
    .from("rsvps")
    .select("player_id")
    .eq("session_id", sessionId)
    .eq("status", "confirmed");
  if (error) return { error: error.message };

  const playerIds = (rsvps ?? []).map((r) => r.player_id);
  const { data: guestsData } = playerIds.length
    ? await supabase
        .from("players")
        .select("name, dupr_id")
        .in("id", playerIds)
        .eq("is_guest", true)
    : { data: [] as { name: string; dupr_id: string | null }[] };

  const guests = (guestsData ?? [])
    .map((g) => ({ name: g.name, duprId: g.dupr_id }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { guests };
}

export type AddParticipantNamesState = { error?: string; addedCount?: number };

/**
 * Adds one or more members and/or guests to a session from a plain
 * comma-separated list of names (used by the "Add players" box on the
 * admin Fixtures page). Each name is matched case-insensitively
 * against every approved player (members and guests): a member match
 * confirms their RSVP, a guest match reuses that guest, and anything
 * unmatched is created as a new guest.
 */
export async function addParticipantNamesToSession(
  sessionId: string,
  names: string[]
): Promise<AddParticipantNamesState> {
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

  const { data: allPlayers } = await supabase
    .from("players")
    .select("id, name, is_guest")
    .eq("status", "approved");

  const byLowerName = new Map(
    (allPlayers ?? []).map((p) => [p.name.trim().toLowerCase(), p])
  );

  for (const name of cleaned) {
    const match = byLowerName.get(name.toLowerCase());

    if (match && !match.is_guest) {
      const { error } = await supabase
        .from("rsvps")
        .upsert(
          { player_id: match.id, session_id: sessionId, status: "confirmed" },
          { onConflict: "player_id,session_id" }
        );
      if (error) return { error: `${name}: ${error.message}` };
    } else {
      const { error } = await supabase.rpc("add_guest_to_session", {
        p_session_id: sessionId,
        p_name: match ? null : name,
        p_existing_guest_id: match ? match.id : null,
      });
      if (error) return { error: `${name}: ${error.message}` };
    }
  }

  await checkSpotsThresholds(sessionId);

  revalidatePath(`/admin/sessions/${sessionId}/fixtures`);
  revalidatePath(`/admin/sessions/${sessionId}/no-shows`);
  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath("/sessions");
  return { addedCount: cleaned.length };
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

  await checkSpotsThresholds(sessionId);

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

  await checkSpotsThresholds(sessionId);

  revalidatePath(`/admin/sessions/${sessionId}/no-shows`);
  revalidatePath(`/admin/sessions/${sessionId}/fixtures`);
  revalidatePath("/sessions");
  return {};
}
