import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToPlayerIds } from "@/lib/actions/push";
import { formatSessionTime } from "@/lib/format";

const WINDOWS = [
  { hours: 24, column: "reminder_24h_sent", label: "24 hours" },
  { hours: 12, column: "reminder_12h_sent", label: "12 hours" },
  { hours: 6, column: "reminder_6h_sent", label: "6 hours" },
] as const;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  let sessionsProcessed = 0;
  let notificationsSent = 0;

  for (const w of WINDOWS) {
    const cutoff = new Date(now.getTime() + w.hours * 60 * 60 * 1000).toISOString();

    const { data: sessions } = await admin
      .from("sessions")
      .select("id, title, date_time, location")
      .eq("status", "upcoming")
      .eq(w.column, false)
      .gt("date_time", now.toISOString())
      .lte("date_time", cutoff);

    for (const session of sessions ?? []) {
      sessionsProcessed += 1;

      const { data: rsvps } = await admin
        .from("rsvps")
        .select("player_id")
        .eq("session_id", session.id)
        .eq("status", "confirmed");
      const playerIds = (rsvps ?? []).map((r) => r.player_id);

      if (playerIds.length > 0) {
        const result = await sendPushToPlayerIds(playerIds, {
          title: `Session in ${w.label}`,
          body: `${session.title} at ${formatSessionTime(session.date_time)} — ${session.location}`,
          url: `/sessions/${session.id}`,
          tag: `reminder-${w.hours}h-${session.id}`,
        });
        notificationsSent += result.sent;
      }

      await admin.from("sessions").update({ [w.column]: true }).eq("id", session.id);
    }
  }

  return NextResponse.json({ ok: true, sessionsProcessed, notificationsSent });
}
