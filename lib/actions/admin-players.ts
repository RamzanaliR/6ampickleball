"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
