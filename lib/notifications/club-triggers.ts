import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToPlayerIds } from "@/lib/actions/push";

/**
 * Fired whenever a post lands in the moderation queue (i.e. posted by
 * someone who isn't an Admin — Managers' posts go to pending too,
 * same as regular members). Notifies every Admin/Manager who can act
 * on it. No dedup needed — each new pending post is its own event,
 * unlike the session-milestone triggers.
 */
export async function notifyPostPendingApproval() {
  try {
    const admin = createAdminClient();
    const { data: staff } = await admin
      .from("players")
      .select("id")
      .in("role", ["admin", "manager"])
      .eq("status", "approved")
      .eq("notify_club_posts_pending", true);

    await sendPushToPlayerIds((staff ?? []).map((p) => p.id), {
      title: "New Club post awaiting approval",
      body: "A member just posted to The Club — tap to review it.",
      url: "/admin/feed",
      tag: "feed-pending",
    });
  } catch (err) {
    console.error("notifyPostPendingApproval failed", err);
  }
}
