"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProfileFormState = { error?: string; success?: boolean };

const SKILL_TIERS = ["beginner", "intermediate", "advanced"];

export async function updateProfile(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const skillTier = String(formData.get("skill_tier") ?? "");

  if (!name) return { error: "Name is required" };

  const { error } = await supabase
    .from("players")
    .update({
      name,
      phone: phone || null,
      skill_tier: SKILL_TIERS.includes(skillTier) ? skillTier : null,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}
