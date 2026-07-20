"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
  return {};
}
