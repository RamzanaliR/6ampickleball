"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type MatchFormState = { error?: string };

export async function submitMatch(
  sessionId: string,
  _prevState: MatchFormState,
  formData: FormData
): Promise<MatchFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const matchType = String(formData.get("match_type") ?? "singles");
  const teamA = [formData.get("team_a_1"), formData.get("team_a_2")]
    .filter(Boolean)
    .map(String);
  const teamB = [formData.get("team_b_1"), formData.get("team_b_2")]
    .filter(Boolean)
    .map(String);

  if (matchType === "singles") {
    if (teamA.length !== 1 || teamB.length !== 1) {
      return { error: "Pick one player for each side." };
    }
  } else if (teamA.length !== 2 || teamB.length !== 2) {
    return { error: "Pick two players for each side in doubles." };
  }

  const allPlayers = [...teamA, ...teamB];
  if (new Set(allPlayers).size !== allPlayers.length) {
    return { error: "A player can't appear on both teams, or twice." };
  }

  const setCount = Number(formData.get("set_count") ?? 0);
  const sets: { a: number; b: number }[] = [];
  for (let i = 0; i < setCount; i++) {
    const a = Number(formData.get(`set_${i}_a`));
    const b = Number(formData.get(`set_${i}_b`));
    if (Number.isNaN(a) || Number.isNaN(b)) {
      return { error: "Every set needs both scores filled in." };
    }
    if (a === b) {
      return { error: `Set ${i + 1} can't end tied.` };
    }
    sets.push({ a, b });
  }
  if (sets.length === 0) {
    return { error: "Add at least one set." };
  }

  const setsWonByA = sets.filter((s) => s.a > s.b).length;
  const setsWonByB = sets.length - setsWonByA;
  if (setsWonByA === setsWonByB) {
    return { error: "Sets are tied overall — add a deciding set." };
  }
  const winningTeam = setsWonByA > setsWonByB ? "a" : "b";

  const { error } = await supabase.from("matches").insert({
    session_id: sessionId,
    team_a: teamA,
    team_b: teamB,
    sets,
    winning_team: winningTeam,
    submitted_by: user.id,
  });

  if (error) {
    return {
      error: error.message.toLowerCase().includes("row-level security")
        ? "You can only submit results for matches you played in."
        : error.message,
    };
  }

  revalidatePath("/sessions");
  revalidatePath("/dashboard");
  redirect("/sessions");
}

export async function verifyMatch(matchId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("verify_match", { p_match_id: matchId });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/matches");
  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  revalidatePath("/dashboard");
}

export async function rejectMatch(matchId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("reject_match", { p_match_id: matchId });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/matches");
  revalidatePath("/admin");
}
