import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToPlayerIds } from "@/lib/actions/push";
import { getDarEsSalaamMorningRain, RAIN_RISK_THRESHOLD } from "@/lib/weather";

/**
 * Checks any upcoming session in the next ~36 hours against the rain
 * forecast, and alerts confirmed players if the chance of rain hits
 * the 75% threshold. Reuses the "reminders" notification preference
 * (notify_reminders) rather than adding a separate weather toggle —
 * it's the same "heads up before your session" category in spirit.
 * Each session only ever gets one weather alert (weather_alert_sent).
 */
export async function checkWeatherAlerts() {
  const admin = createAdminClient();
  const now = new Date();
  const cutoff = new Date(now.getTime() + 36 * 60 * 60 * 1000);

  const { data: sessions } = await admin
    .from("sessions")
    .select("id, title, date_time, location")
    .eq("status", "upcoming")
    .eq("weather_alert_sent", false)
    .gt("date_time", now.toISOString())
    .lte("date_time", cutoff.toISOString());

  if (!sessions || sessions.length === 0) return { checked: 0, alerted: 0 };

  const rainMap = await getDarEsSalaamMorningRain();
  let alerted = 0;

  for (const session of sessions) {
    const dateKey = new Date(session.date_time).toLocaleDateString("en-CA", {
      timeZone: "Africa/Dar_es_Salaam",
    });
    const risk = rainMap.get(dateKey);

    if (risk && risk.pop >= RAIN_RISK_THRESHOLD) {
      const { data: rsvps } = await admin
        .from("rsvps")
        .select("player_id")
        .eq("session_id", session.id)
        .eq("status", "confirmed");
      const confirmedIds = (rsvps ?? []).map((r) => r.player_id);

      const { data: optedIn } = confirmedIds.length
        ? await admin.from("players").select("id").in("id", confirmedIds).eq("notify_reminders", true)
        : { data: [] as { id: string }[] };
      const playerIds = (optedIn ?? []).map((p) => p.id);

      if (playerIds.length > 0) {
        await sendPushToPlayerIds(playerIds, {
          title: "Rain likely for your session",
          body: `${Math.round(risk.pop * 100)}% chance of rain for ${session.title} at ${session.location} — have a backup plan.`,
          url: `/sessions/${session.id}`,
          tag: `weather-${session.id}`,
        });
        alerted += 1;
      }

      // Mark sent regardless of whether anyone had notifications on —
      // otherwise it'd re-check (and potentially re-notify newly
      // opted-in players oddly) every 15 minutes until the session passes.
      await admin.from("sessions").update({ weather_alert_sent: true }).eq("id", session.id);
    }
  }

  return { checked: sessions.length, alerted };
}
