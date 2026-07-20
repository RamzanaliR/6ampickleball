"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { displayName } from "@/lib/format";

export type SetNoShowResult = { error?: string };

export async function setNoShow(
  sessionId: string,
  playerId: string,
  noShow: boolean
): Promise<SetNoShowResult> {
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

  const { error } = await supabase
    .from("rsvps")
    .update({ no_show: noShow })
    .eq("session_id", sessionId)
    .eq("player_id", playerId);
  if (error) return { error: error.message };

  revalidatePath(`/admin/sessions/${sessionId}/no-shows`);
  revalidatePath("/sessions");
  return {};
}

export type NoShowRosterEntry = { playerId: string; name: string; noShow: boolean };
export type GetNoShowRosterResult = { error?: string; roster?: NoShowRosterEntry[] };

/**
 * Confirmed roster for a session, for the No-shows popup. Read-only,
 * but still staff-gated since it's reachable straight from the
 * Sessions list without going through the dedicated admin page.
 */
export async function getNoShowRoster(sessionId: string): Promise<GetNoShowRosterResult> {
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
    .select("player_id, no_show")
    .eq("session_id", sessionId)
    .eq("status", "confirmed");
  if (error) return { error: error.message };

  const playerIds = (rsvps ?? []).map((r) => r.player_id);
  const { data: playersData } = playerIds.length
    ? await supabase.from("players").select("id, name, nickname").in("id", playerIds)
    : { data: [] as { id: string; name: string; nickname: string | null }[] };
  const nameById = new Map((playersData ?? []).map((p) => [p.id, displayName(p)]));

  const roster = (rsvps ?? [])
    .map((r) => ({
      playerId: r.player_id,
      name: nameById.get(r.player_id) ?? "Unknown",
      noShow: r.no_show,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { roster };
}
