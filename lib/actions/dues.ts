"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type AdminCheck =
  | { ok: true; user: { id: string } }
  | { ok: false; error: string };

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>): Promise<AdminCheck> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: me } = await supabase
    .from("players")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") return { ok: false, error: "Admins only" };

  return { ok: true, user };
}

export type SetDuesAmountResult = { error?: string };

export async function setMemberDuesAmount(
  playerId: string,
  amount: number | null
): Promise<SetDuesAmountResult> {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin.ok) return { error: admin.error };

  const { error } = await supabase
    .from("players")
    .update({ monthly_dues_amount: amount && amount > 0 ? amount : null })
    .eq("id", playerId);
  if (error) return { error: error.message };

  revalidatePath("/admin/players");
  return {};
}

export type ChargeDuesResult = { error?: string; chargedCount?: number; totalAmount?: number };

/**
 * Creates an unpaid membership charge for every approved, non-guest
 * member who has a preset dues amount, for the given month — skipping
 * anyone who already has a membership charge for that period so this
 * is safe to run more than once. Records the month as "charged" so
 * the admin overview reminder stops showing for it.
 */
export async function chargeMonthlyDues(period: string): Promise<ChargeDuesResult> {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin.ok) return { error: admin.error };

  const { data: members, error: membersError } = await supabase
    .from("players")
    .select("id, monthly_dues_amount")
    .eq("status", "approved")
    .eq("is_guest", false)
    .not("monthly_dues_amount", "is", null)
    .gt("monthly_dues_amount", 0);
  if (membersError) return { error: membersError.message };

  const { data: existing, error: existingError } = await supabase
    .from("payments")
    .select("player_id")
    .eq("direction", "received")
    .eq("type", "membership")
    .eq("period", period);
  if (existingError) return { error: existingError.message };
  const alreadyCharged = new Set((existing ?? []).map((p) => p.player_id));

  const toCharge = (members ?? []).filter((m) => !alreadyCharged.has(m.id));

  if (toCharge.length > 0) {
    const { error: insertError } = await supabase.from("payments").insert(
      toCharge.map((m) => ({
        direction: "received",
        player_id: m.id,
        type: "membership",
        period,
        amount: m.monthly_dues_amount,
        method: "manual",
        status: "unpaid",
      }))
    );
    if (insertError) return { error: insertError.message };
  }

  const { error: monthError } = await supabase
    .from("dues_months")
    .upsert({ period, status: "charged", decided_by: admin.user.id, decided_at: new Date().toISOString() });
  if (monthError) return { error: monthError.message };

  revalidatePath("/admin");
  revalidatePath("/admin/payments");
  revalidatePath("/dashboard");

  const totalAmount = toCharge.reduce((sum, m) => sum + Number(m.monthly_dues_amount ?? 0), 0);
  return { chargedCount: toCharge.length, totalAmount };
}

export type SkipDuesResult = { error?: string };

/** Marks a month as skipped — no dues charged, members pay per-session. */
export async function skipMonthlyDues(period: string): Promise<SkipDuesResult> {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin.ok) return { error: admin.error };

  const { error } = await supabase
    .from("dues_months")
    .upsert({ period, status: "skipped", decided_by: admin.user.id, decided_at: new Date().toISOString() });
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return {};
}
