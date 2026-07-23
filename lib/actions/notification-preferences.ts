"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type NotificationPreferences = {
  notifyNewSession: boolean;
  notifySpotsRemaining: boolean;
  notifyFixturesReady: boolean;
  notifyReminders: boolean;
  notifyClubPostsPending: boolean;
};

const defaults: NotificationPreferences = {
  notifyNewSession: true,
  notifySpotsRemaining: true,
  notifyFixturesReady: true,
  notifyReminders: true,
  notifyClubPostsPending: true,
};

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return defaults;

  const { data } = await supabase
    .from("players")
    .select(
      "notify_new_session, notify_spots_remaining, notify_fixtures_ready, notify_reminders, notify_club_posts_pending"
    )
    .eq("id", user.id)
    .single();

  if (!data) return defaults;

  return {
    notifyNewSession: data.notify_new_session,
    notifySpotsRemaining: data.notify_spots_remaining,
    notifyFixturesReady: data.notify_fixtures_ready,
    notifyReminders: data.notify_reminders,
    notifyClubPostsPending: data.notify_club_posts_pending,
  };
}

export type UpdatePreferencesState = { error?: string; success?: boolean };

export async function updateNotificationPreferences(
  _prevState: UpdatePreferencesState,
  formData: FormData
): Promise<UpdatePreferencesState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("players")
    .update({
      notify_new_session: formData.get("notify_new_session") === "on",
      notify_spots_remaining: formData.get("notify_spots_remaining") === "on",
      notify_fixtures_ready: formData.get("notify_fixtures_ready") === "on",
      notify_reminders: formData.get("notify_reminders") === "on",
      notify_club_posts_pending: formData.get("notify_club_posts_pending") === "on",
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}
