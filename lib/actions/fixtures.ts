"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateClassicRobin, winningTeamFromSets } from "@/lib/fixtures/generate-classic-robin";
import type { FixtureSettings, MatchSet } from "@/lib/types";

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
  return user.id;
}

export type GenerateFixturesState = { error?: string };

export async function generateFixtures(
  sessionId: string,
  _prevState: GenerateFixturesState,
  formData: FormData
): Promise<GenerateFixturesState> {
  const supabase = await createClient();
  let adminId: string;
  try {
    adminId = await requireAdmin(supabase);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized" };
  }

  const courts = Number(formData.get("courts"));
  const roundMinutesLabel = String(formData.get("round_minutes_label") ?? "10 min");
  const scoring = String(formData.get("scoring") ?? "points") as FixtureSettings["scoring"];
  const rankBy = String(formData.get("rank_by") ?? "wins") as FixtureSettings["rankBy"];
  const tiebreak = String(formData.get("tiebreak") ?? "wins") as FixtureSettings["tiebreak"];

  if (!courts || courts < 1) return { error: "Enter at least 1 court." };

  // Already generated? Don't silently duplicate a schedule.
  const { count: existingCount } = await supabase
    .from("matches")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .eq("source", "fixture");
  if (existingCount && existingCount > 0) {
    return { error: "Fixtures already exist for this session." };
  }

  const { data: rsvps } = await supabase
    .from("rsvps")
    .select("player_id")
    .eq("session_id", sessionId)
    .eq("status", "confirmed");

  const playerIds = (rsvps ?? []).map((r) => r.player_id);

  let schedule;
  try {
    schedule = generateClassicRobin(playerIds, courts, 10);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't generate fixtures." };
  }

  const rows = schedule.map((m) => ({
    session_id: sessionId,
    team_a: m.teamA,
    team_b: m.teamB,
    sets: [] as MatchSet[],
    winning_team: null,
    verified: false,
    submitted_by: adminId,
    round_number: m.round,
    court_number: m.court,
    source: "fixture" as const,
  }));

  const { error } = await supabase.from("matches").insert(rows);
  if (error) return { error: error.message };

  const settings: FixtureSettings = { courts, roundMinutesLabel, scoring, rankBy, tiebreak };
  await supabase.from("sessions").update({ fixture_settings: settings }).eq("id", sessionId);

  revalidatePath(`/admin/sessions/${sessionId}/fixtures`);
  return {};
}

export async function scoreFixtureMatch(matchId: string, sessionId: string, sets: MatchSet[]) {
  const supabase = await createClient();

  try {
    winningTeamFromSets(sets);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Invalid score");
  }

  const { error } = await supabase.rpc("score_fixture_match", {
    p_match_id: matchId,
    p_sets: sets,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/sessions/${sessionId}/fixtures`);
  revalidatePath("/leaderboard");
  revalidatePath("/dashboard");
}

export async function editMatchResult(matchId: string, sets: MatchSet[], revalidate: string[]) {
  const supabase = await createClient();

  try {
    winningTeamFromSets(sets);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Invalid score");
  }

  const { error } = await supabase.rpc("edit_match_result", {
    p_match_id: matchId,
    p_sets: sets,
  });
  if (error) throw new Error(error.message);

  for (const path of revalidate) revalidatePath(path);
  revalidatePath("/leaderboard");
  revalidatePath("/dashboard");
}
