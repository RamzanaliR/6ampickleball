"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setNoShow(sessionId: string, playerId: string, noShow: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: me } = await supabase
    .from("players")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") throw new Error("Admins only");

  const { error } = await supabase
    .from("rsvps")
    .update({ no_show: noShow })
    .eq("session_id", sessionId)
    .eq("player_id", playerId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/sessions/${sessionId}/no-shows`);
}
