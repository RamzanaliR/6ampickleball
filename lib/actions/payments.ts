"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PaymentFormState = { error?: string; success?: boolean };

export async function createPayment(
  _prevState: PaymentFormState,
  formData: FormData
): Promise<PaymentFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const direction = String(formData.get("direction") ?? "received");
  const amount = Number(formData.get("amount"));
  if (!amount || amount <= 0) return { error: "Enter a valid amount." };

  if (direction === "paid") {
    const paidTo = String(formData.get("paid_to") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const paidBy = String(formData.get("paid_by") ?? "").trim();

    if (!paidTo) return { error: "Enter who this was paid to." };

    const { error } = await supabase.from("payments").insert({
      direction: "paid",
      paid_to: paidTo,
      description: description || null,
      paid_by: paidBy || null,
      amount,
      method: "manual",
      status: "paid",
      paid_at: new Date().toISOString(),
      marked_by: user.id,
    });

    if (error) return { error: error.message };
  } else {
    const playerId = String(formData.get("player_id") ?? "");
    const type = String(formData.get("type") ?? "");
    const sessionId = String(formData.get("session_id") ?? "") || null;
    const period = String(formData.get("period") ?? "").trim() || null;
    const receivedBy = String(formData.get("received_by") ?? "").trim();

    if (!playerId) return { error: "Pick a player." };
    if (type !== "session_fee" && type !== "membership") {
      return { error: "Pick a charge type." };
    }
    if (type === "session_fee" && !sessionId) {
      return { error: "Pick a session for a session fee." };
    }
    if (type === "membership" && !period) {
      return { error: "Pick a month for a membership charge." };
    }

    const { error } = await supabase.from("payments").insert({
      direction: "received",
      player_id: playerId,
      type,
      amount,
      session_id: type === "session_fee" ? sessionId : null,
      period: type === "membership" ? period : null,
      received_by: receivedBy || null,
      method: "manual",
      status: "unpaid",
    });

    if (error) return { error: error.message };
  }

  revalidatePath("/admin/payments");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { success: true };
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
