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
  const duprId = String(formData.get("dupr_id") ?? "").trim();

  if (!name) return { error: "Name is required" };

  const { error } = await supabase
    .from("players")
    .update({
      name,
      phone: phone || null,
      skill_tier: SKILL_TIERS.includes(skillTier) ? skillTier : null,
      dupr_id: duprId || null,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

export type PasswordFormState = { error?: string; success?: boolean };

export async function updatePassword(
  _prevState: PasswordFormState,
  formData: FormData
): Promise<PasswordFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (password.length < 6) return { error: "Password must be at least 6 characters." };
  if (password !== confirmPassword) return { error: "Passwords don't match." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  return { success: true };
}
