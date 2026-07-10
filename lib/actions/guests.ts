"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AddGuestState = { error?: string };

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

  revalidatePath(`/admin/sessions/${sessionId}/attendance`);
  revalidatePath(`/admin/sessions/${sessionId}/fixtures`);
  revalidatePath("/sessions");
  return {};
}
