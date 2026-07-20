"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { darDateTimeToISO } from "@/lib/format";
import { requireAdminId, requireStaffId } from "@/lib/auth/roles";

export type SessionFormState = { error?: string };

function readSessionFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const location = String(formData.get("location") ?? "").trim();
  const capacity = Number(formData.get("capacity"));
  const courtsRaw = String(formData.get("courts") ?? "").trim();
  const courts = courtsRaw ? Number(courtsRaw) : null;
  const tournamentId = String(formData.get("tournament_id") ?? "").trim() || null;
  // Tournament sessions never count toward the season leaderboard — this
  // is enforced here, not just defaulted in the UI, so there's no path
  // (re-checking the box, editing later) that lets a tournament session
  // sneak onto the season standings.
  const countsTowardLeaderboard = tournamentId
    ? false
    : formData.get("counts_toward_leaderboard") === "on";
  const duprEligible = formData.get("dupr_eligible") === "on";

  if (!title || !date || !time || !location || !capacity || capacity < 1) {
    return { error: "Fill in every field with a capacity of at least 1." } as const;
  }
  if (courts !== null && (Number.isNaN(courts) || courts < 1)) {
    return { error: "Courts booked must be at least 1, or left blank." } as const;
  }

  const dateTime = darDateTimeToISO(date, time);
  if (Number.isNaN(new Date(dateTime).getTime())) {
    return { error: "That date/time doesn't look valid." } as const;
  }

  return {
    title,
    dateTime,
    location,
    capacity,
    courts,
    countsTowardLeaderboard,
    duprEligible,
    tournamentId,
  } as const;
}

export async function createSession(
  _prevState: SessionFormState,
  formData: FormData
): Promise<SessionFormState> {
  const supabase = await createClient();
  let adminId: string;
  try {
    adminId = await requireStaffId(supabase);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized" };
  }

  const fields = readSessionFields(formData);
  if ("error" in fields) return fields;

  const { error } = await supabase.from("sessions").insert({
    title: fields.title,
    date_time: fields.dateTime,
    location: fields.location,
    capacity: fields.capacity,
    courts: fields.courts,
    counts_toward_leaderboard: fields.countsTowardLeaderboard,
    dupr_eligible: fields.duprEligible,
    tournament_id: fields.tournamentId,
    created_by: adminId,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/sessions");
  revalidatePath("/sessions");
  redirect("/admin/sessions");
}

export async function updateSession(
  sessionId: string,
  _prevState: SessionFormState,
  formData: FormData
): Promise<SessionFormState> {
  const supabase = await createClient();
  try {
    await requireStaffId(supabase);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized" };
  }

  const fields = readSessionFields(formData);
  if ("error" in fields) return fields;

  const { error } = await supabase
    .from("sessions")
    .update({
      title: fields.title,
      date_time: fields.dateTime,
      location: fields.location,
      capacity: fields.capacity,
      courts: fields.courts,
      counts_toward_leaderboard: fields.countsTowardLeaderboard,
      dupr_eligible: fields.duprEligible,
      tournament_id: fields.tournamentId,
    })
    .eq("id", sessionId);

  if (error) return { error: error.message };

  revalidatePath("/admin/sessions");
  revalidatePath("/sessions");
  revalidatePath("/dashboard");
  redirect("/admin/sessions");
}

export async function setSessionStatus(
  sessionId: string,
  status: "upcoming" | "completed" | "cancelled"
) {
  const supabase = await createClient();
  await requireAdminId(supabase);

  const { error } = await supabase
    .from("sessions")
    .update({ status })
    .eq("id", sessionId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/sessions");
  revalidatePath("/sessions");
  revalidatePath("/dashboard");
}

export async function deleteSession(sessionId: string) {
  const supabase = await createClient();
  await requireAdminId(supabase);

  const { error } = await supabase.rpc("delete_session", { p_session_id: sessionId });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/sessions");
  revalidatePath("/sessions");
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
}

export type BulkActionResult = { error?: string; count?: number };

export async function bulkSetSessionStatus(
  sessionIds: string[],
  status: "upcoming" | "completed" | "cancelled"
): Promise<BulkActionResult> {
  const supabase = await createClient();
  try {
    await requireAdminId(supabase);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized" };
  }
  if (sessionIds.length === 0) return { error: "Nothing selected." };

  const { error } = await supabase.from("sessions").update({ status }).in("id", sessionIds);
  if (error) return { error: error.message };

  revalidatePath("/admin/sessions");
  revalidatePath("/sessions");
  revalidatePath("/dashboard");
  return { count: sessionIds.length };
}

export async function bulkDeleteSessions(sessionIds: string[]): Promise<BulkActionResult> {
  const supabase = await createClient();
  try {
    await requireAdminId(supabase);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized" };
  }
  if (sessionIds.length === 0) return { error: "Nothing selected." };

  for (const id of sessionIds) {
    const { error } = await supabase.rpc("delete_session", { p_session_id: id });
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/sessions");
  revalidatePath("/sessions");
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
  return { count: sessionIds.length };
}
