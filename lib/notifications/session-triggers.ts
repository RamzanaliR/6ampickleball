import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToPlayerIds } from "@/lib/actions/push";
import { formatSessionDate, formatSessionTime } from "@/lib/format";

const SPOT_THRESHOLDS = [10, 5, 2];

/**
 * Fired once, right after a session is created. Notifies every
 * approved member (not guests — they have no login/subscription).
 * No dedup column needed since this only ever runs once, synchronously,
 * from createSession itself.
 */
export async function notifyNewSession(sessionId: string) {
  try {
    const admin = createAdminClient();
    const { data: session } = await admin
      .from("sessions")
      .select("title, date_time, location")
      .eq("id", sessionId)
      .single();
    if (!session) return;

    const { data: members } = await admin
      .from("players")
      .select("id")
      .eq("status", "approved")
      .eq("is_guest", false);

    await sendPushToPlayerIds(
      (members ?? []).map((p) => p.id),
      {
        title: "New session posted",
        body: `${session.title} — ${formatSessionDate(session.date_time)} · ${formatSessionTime(session.date_time)} at ${session.location}`,
        url: `/sessions/${sessionId}`,
        tag: `session-new-${sessionId}`,
      }
    );
  } catch (err) {
    console.error("notifyNewSession failed", err);
  }
}

/**
 * Call this after any action that confirms someone into a session
 * (self RSVP, admin/manager adding a member or guest). Checks whether
 * the confirmed count just crossed 10, 5, or 2 spots remaining, and
 * if so notifies approved members who aren't already in that session.
 * Each threshold only ever fires once per session.
 */
export async function checkSpotsThresholds(sessionId: string) {
  try {
    const admin = createAdminClient();
    const { data: session } = await admin
      .from("sessions")
      .select("id, title, capacity, notified_spots_thresholds, status")
      .eq("id", sessionId)
      .single();
    if (!session || session.status !== "upcoming") return;

    const { count } = await admin
      .from("rsvps")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId)
      .eq("status", "confirmed");

    const confirmed = count ?? 0;
    const spotsLeft = session.capacity - confirmed;
    const already: number[] = session.notified_spots_thresholds ?? [];
    const toNotify = SPOT_THRESHOLDS.filter(
      (t) => spotsLeft <= t && spotsLeft > 0 && !already.includes(t)
    );
    if (toNotify.length === 0) return;

    const { data: existingRsvps } = await admin
      .from("rsvps")
      .select("player_id")
      .eq("session_id", sessionId);
    const alreadyInIds = new Set((existingRsvps ?? []).map((r) => r.player_id));

    const { data: members } = await admin
      .from("players")
      .select("id")
      .eq("status", "approved")
      .eq("is_guest", false);
    const targetIds = (members ?? []).map((p) => p.id).filter((id) => !alreadyInIds.has(id));

    const lowestCrossed = Math.min(...toNotify);
    await sendPushToPlayerIds(targetIds, {
      title: `${lowestCrossed} spot${lowestCrossed === 1 ? "" : "s"} left`,
      body: `${session.title} is filling up — ${spotsLeft} of ${session.capacity} spots remain.`,
      url: `/sessions/${sessionId}`,
      tag: `session-spots-${sessionId}`,
    });

    await admin
      .from("sessions")
      .update({ notified_spots_thresholds: [...already, ...toNotify] })
      .eq("id", sessionId);
  } catch (err) {
    console.error("checkSpotsThresholds failed", err);
  }
}

/** Call this right after fixtures are generated for a session. */
export async function notifyFixturesReady(sessionId: string) {
  try {
    const admin = createAdminClient();
    const { data: session } = await admin
      .from("sessions")
      .select("title, notified_fixtures_ready")
      .eq("id", sessionId)
      .single();
    if (!session || session.notified_fixtures_ready) return;

    const { data: matches } = await admin
      .from("matches")
      .select("team_a, team_b")
      .eq("session_id", sessionId)
      .eq("source", "fixture");
    if (!matches || matches.length === 0) return;

    const playerIds = [...new Set(matches.flatMap((m) => [...m.team_a, ...m.team_b]))];

    await sendPushToPlayerIds(playerIds, {
      title: "Your fixtures are ready",
      body: `${session.title} — your matches are set. Tap to see your schedule.`,
      url: `/sessions/${sessionId}`,
      tag: `fixtures-ready-${sessionId}`,
    });

    await admin.from("sessions").update({ notified_fixtures_ready: true }).eq("id", sessionId);
  } catch (err) {
    console.error("notifyFixturesReady failed", err);
  }
}
