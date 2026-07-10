"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type PaymentFormState = { error?: string };

export async function createPayment(
  _prevState: PaymentFormState,
  formData: FormData
): Promise<PaymentFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const playerId = String(formData.get("player_id") ?? "");
  const type = String(formData.get("type") ?? "");
  const amount = Number(formData.get("amount"));
  const sessionId = String(formData.get("session_id") ?? "") || null;
  const period = String(formData.get("period") ?? "").trim() || null;

  if (!playerId) return { error: "Pick a player." };
  if (type !== "session_fee" && type !== "membership") {
    return { error: "Pick a charge type." };
  }
  if (!amount || amount <= 0) return { error: "Enter a valid amount." };
  if (type === "session_fee" && !sessionId) {
    return { error: "Pick a session for a session fee." };
  }
  if (type === "membership" && !period) {
    return { error: "Enter a period (e.g. 2026-07) for a membership charge." };
  }

  const { error } = await supabase.from("payments").insert({
    player_id: playerId,
    type,
    amount,
    session_id: type === "session_fee" ? sessionId : null,
    period: type === "membership" ? period : null,
    method: "manual",
    status: "unpaid",
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/payments");
  revalidatePath("/dashboard");
  redirect("/admin/payments");
}

export async function setPaymentStatus(paymentId: string, status: "paid" | "unpaid") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("payments")
    .update({
      status,
      marked_by: user.id,
      paid_at: status === "paid" ? new Date().toISOString() : null,
    })
    .eq("id", paymentId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/payments");
  revalidatePath("/dashboard");
}
