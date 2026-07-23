"use server";

import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const vapidConfigured =
  !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && !!process.env.VAPID_PRIVATE_KEY;

if (vapidConfigured) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@example.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
}

export type PushActionState = { error?: string; success?: boolean };

export type PushSubscriptionJSON = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

/** Called from the browser right after a successful subscribe(). */
export async function savePushSubscription(sub: PushSubscriptionJSON, userAgent: string): Promise<PushActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      player_id: user.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      user_agent: userAgent,
    },
    { onConflict: "endpoint" }
  );
  if (error) return { error: error.message };
  return { success: true };
}

/** Called when the user turns notifications off in the UI. */
export async function deletePushSubscription(endpoint: string): Promise<PushActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("player_id", user.id)
    .eq("endpoint", endpoint);
  if (error) return { error: error.message };
  return { success: true };
}

export type PushPayload = { title: string; body: string; url?: string; tag?: string };

/**
 * Reusable sender for phase 2's real triggers (new session, spots
 * remaining, fixtures ready, reminders). Uses the service-role client
 * since it needs to reach subscriptions belonging to players other
 * than whoever triggered the event (e.g. "notify all approved
 * members" isn't being run by each of those members).
 *
 * Silently drops subscriptions the push service reports as gone
 * (404/410 — e.g. the app was uninstalled) so the table doesn't
 * accumulate dead rows over time.
 */
export async function sendPushToPlayerIds(playerIds: string[], payload: PushPayload) {
  if (!vapidConfigured) {
    console.error("Push not configured: missing VAPID env vars.");
    return { sent: 0, failed: 0 };
  }
  if (playerIds.length === 0) return { sent: 0, failed: 0 };

  const admin = createAdminClient();
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("player_id", playerIds);

  let sent = 0;
  let failed = 0;
  const deadIds: string[] = [];

  await Promise.all(
    (subs ?? []).map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
        );
        sent += 1;
      } catch (err: unknown) {
        failed += 1;
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          deadIds.push(sub.id);
        }
      }
    })
  );

  if (deadIds.length > 0) {
    await admin.from("push_subscriptions").delete().in("id", deadIds);
  }

  return { sent, failed };
}

/** Phase 1 only: confirms the whole pipeline works end to end for the caller. */
export async function sendTestPush(): Promise<PushActionState & { sent?: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (!vapidConfigured) {
    return { error: "Push isn't configured yet — VAPID keys are missing on the server." };
  }

  const result = await sendPushToPlayerIds([user.id], {
    title: "Test notification",
    body: "If you can see this, push notifications are working 🎾",
    url: "/dashboard",
  });

  if (result.sent === 0) {
    return { error: "No active subscription found to send to. Try enabling notifications again." };
  }
  return { success: true, sent: result.sent };
}
