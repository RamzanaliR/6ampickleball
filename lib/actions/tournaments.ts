"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { FixtureRankBy, FixtureScoring, FixtureTiebreak } from "@/lib/types";

async function requireAdminId(supabase: Awaited<ReturnType<typeof createClient>>) {
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

export type TournamentFormState = { error?: string };

export async function createTournament(
  _prevState: TournamentFormState,
  formData: FormData
): Promise<TournamentFormState> {
  const supabase = await createClient();
  let adminId: string;
  try {
    adminId = await requireAdminId(supabase);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized" };
  }

  const name = String(formData.get("name") ?? "").trim();
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "");
  const scoring = String(formData.get("scoring") ?? "points") as FixtureScoring;
  const rankBy = String(formData.get("rank_by") ?? "wins") as FixtureRankBy;
  const tiebreak = String(formData.get("tiebreak") ?? "point_diff") as FixtureTiebreak;

  if (!name) return { error: "Name is required." };
  if (!startDate || !endDate) return { error: "Pick a start and end date." };
  if (startDate > endDate) return { error: "Start date has to be before the end date." };

  const { data: tournament, error } = await supabase
    .from("tournaments")
    .insert({
      name,
      start_date: startDate,
      end_date: endDate,
      scoring,
      rank_by: rankBy,
      tiebreak,
      created_by: adminId,
    })
    .select("id")
    .single();

  if (error || !tournament) return { error: error?.message ?? "Couldn't create the tournament." };

  revalidatePath("/admin/tournaments");
  redirect(`/admin/tournaments/${tournament.id}`);
}

export type EntryFormState = { error?: string };

export async function addTournamentEntry(
  tournamentId: string,
  _prevState: EntryFormState,
  formData: FormData
): Promise<EntryFormState> {
  const supabase = await createClient();
  try {
    await requireAdminId(supabase);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized" };
  }

  const playerId = String(formData.get("player_id") ?? "");
  if (!playerId) return { error: "Pick a player." };

  const { error } = await supabase
    .from("tournament_entries")
    .insert({ tournament_id: tournamentId, player_id: playerId });

  if (error) {
    return {
      error: error.message.toLowerCase().includes("duplicate")
        ? "Already registered."
        : error.message,
    };
  }

  revalidatePath(`/admin/tournaments/${tournamentId}`);
  return {};
}

export async function removeTournamentEntry(tournamentId: string, playerId: string) {
  const supabase = await createClient();
  await requireAdminId(supabase);

  const { error } = await supabase
    .from("tournament_entries")
    .delete()
    .eq("tournament_id", tournamentId)
    .eq("player_id", playerId);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/tournaments/${tournamentId}`);
}
