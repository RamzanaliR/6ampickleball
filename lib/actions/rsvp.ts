"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkSpotsThresholds } from "@/lib/notifications/session-triggers";

export async function rsvpToSession(sessionId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("rsvp_to_session", {
    p_session_id: sessionId,
  });
  if (error) throw new Error(error.message);
  await checkSpotsThresholds(sessionId);
  revalidatePath("/sessions");
  revalidatePath("/dashboard");
}

export async function cancelRsvp(sessionId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_rsvp", {
    p_session_id: sessionId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/sessions");
  revalidatePath("/dashboard");
}
