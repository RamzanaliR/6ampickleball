"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
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

  return user;
}

export async function setMemberDuesAmount(playerId: string, amount: number | null) {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const { error } = await supabase
    .from("players")
    .update({ monthly_dues_amount: amount && amount > 0 ? amount : null })
    .eq("id", playerId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/players");
}

export type ChargeDuesResult = { chargedCount: number; totalAmount: number };

/**
 * Creates an unpaid membership charge for every approved, non-guest
 * member who has a preset dues amount, for the given month — skipping
 * anyone who already has a membership charge for that period so this
 * is safe to run more than once. Records the month as "charged" so
 * the admin overview reminder stops showing for it.
 */
export async function chargeMonthlyDues(period: string): Promise<ChargeDuesResult> {
  const supabase = await createClient();
  const user = await requireAdmin(supabase);

  const { data: members, error: membersError } = await supabase
    .from("players")
    .select("id, monthly_dues_amount")
    .eq("status", "approved")
    .eq("is_guest", false)
    .not("monthly_dues_amount", "is", null)
    .gt("monthly_dues_amount", 0);
  if (membersError) throw new Error(membersError.message);

  const { data: existing, error: existingError } = await supabase
    .from("payments")
    .select("player_id")
    .eq("direction", "received")
    .eq("type", "membership")
    .eq("period", period);
  if (existingError) throw new Error(existingError.message);
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
    if (insertError) throw new Error(insertError.message);
  }

  const { error: monthError } = await supabase
    .from("dues_months")
    .upsert({ period, status: "charged", decided_by: user.id, decided_at: new Date().toISOString() });
  if (monthError) throw new Error(monthError.message);

  revalidatePath("/admin");
  revalidatePath("/admin/payments");
  revalidatePath("/dashboard");

  const totalAmount = toCharge.reduce((sum, m) => sum + Number(m.monthly_dues_amount ?? 0), 0);
  return { chargedCount: toCharge.length, totalAmount };
}

/** Marks a month as skipped — no dues charged, members pay per-session. */
export async function skipMonthlyDues(period: string) {
  const supabase = await createClient();
  const user = await requireAdmin(supabase);

  const { error } = await supabase
    .from("dues_months")
    .upsert({ period, status: "skipped", decided_by: user.id, decided_at: new Date().toISOString() });
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
}
