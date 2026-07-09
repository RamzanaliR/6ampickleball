"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { darDateTimeToISO } from "@/lib/format";

export type SessionFormState = { error?: string };

async function requireAdminId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: player } = await supabase
    .from("players")
    .select("role")
    .eq("id", user.id)
    .single();

  if (player?.role !== "admin") throw new Error("Admins only");
  return user.id;
}

function readSessionFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const location = String(formData.get("location") ?? "").trim();
  const capacity = Number(formData.get("capacity"));

  if (!title || !date || !time || !location || !capacity || capacity < 1) {
    return { error: "Fill in every field with a capacity of at least 1." } as const;
  }

  const dateTime = darDateTimeToISO(date, time);
  if (Number.isNaN(new Date(dateTime).getTime())) {
    return { error: "That date/time doesn't look valid." } as const;
  }

  return { title, dateTime, location, capacity } as const;
}

export async function createSession(
  _prevState: SessionFormState,
  formData: FormData
): Promise<SessionFormState> {
  const supabase = await createClient();
  let adminId: string;
  try {
    adminId = await requireAdminId(supabase);
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
    await requireAdminId(supabase);
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
