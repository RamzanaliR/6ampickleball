"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setAttendance(sessionId: string, playerId: string, attended: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (attended) {
    const { error } = await supabase
      .from("attendance")
      .upsert(
        { session_id: sessionId, player_id: playerId, checked_in_by: user.id },
        { onConflict: "player_id,session_id" }
      );
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("attendance")
      .delete()
      .eq("session_id", sessionId)
      .eq("player_id", playerId);
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/admin/sessions/${sessionId}/attendance`);
}
