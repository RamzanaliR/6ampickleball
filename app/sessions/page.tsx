import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { SessionCard } from "@/components/session-card";
import { formatSessionDate } from "@/lib/format";

type RsvpState = "confirmed" | "waitlisted" | "none";

export default async function SessionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: player } = await supabase
    .from("players")
    .select("status")
    .eq("id", user.id)
    .single();

  if (player?.status !== "approved") {
    return (
      <div>
        <PageHeader eyebrow="This week & beyond" title="Sessions" />
        <div className="mx-auto mt-8 max-w-6xl px-6 pb-16">
          <EmptyState message="Your account needs admin approval before you can say I'm in for sessions." />
        </div>
      </div>
    );
  }

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, title, date_time, location, capacity, status")
    .in("status", ["upcoming", "completed"])
    .order("date_time", { ascending: true });

  const upcoming = (sessions ?? []).filter((s) => s.status === "upcoming");
  const completed = (sessions ?? [])
    .filter((s) => s.status === "completed")
    .slice(-5)
    .reverse();

  const sessionIds = (sessions ?? []).map((s) => s.id);
  const { data: rsvps } = sessionIds.length
    ? await supabase
        .from("rsvps")
        .select("session_id, player_id, status")
        .in("session_id", sessionIds)
        .in("status", ["confirmed", "waitlisted"])
    : { data: [] };

  const confirmedCountBySession = new Map<string, number>();
  const myStatusBySession = new Map<string, RsvpState>();
  for (const r of rsvps ?? []) {
    if (r.status === "confirmed") {
      confirmedCountBySession.set(
        r.session_id,
        (confirmedCountBySession.get(r.session_id) ?? 0) + 1
      );
    }
    if (r.player_id === user.id) {
      myStatusBySession.set(r.session_id, r.status as RsvpState);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="This week & beyond"
        title="Sessions"
        subtitle="Say I'm in before spots fill — the waitlist kicks in automatically."
      />
      <div className="mx-auto mt-8 max-w-6xl space-y-12 px-6 pb-16">
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
            Upcoming
          </h2>
          <div className="mt-4">
            {upcoming.length === 0 ? (
              <EmptyState message="No sessions scheduled yet — check back soon." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {upcoming.map((s) => {
                  const confirmedCount = confirmedCountBySession.get(s.id) ?? 0;
                  const spotsLeft = Math.max(s.capacity - confirmedCount, 0);
                  const myStatus = myStatusBySession.get(s.id) ?? "none";
                  return (
                    <SessionCard
                      key={s.id}
                      session={s}
                      spotsLeft={spotsLeft}
                      myStatus={myStatus}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {completed.length > 0 && (
          <section>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
              Recently completed
            </h2>
            <div className="mt-4 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)]">
              {completed.map((s, i) => (
                <div
                  key={s.id}
                  className={`flex items-center justify-between px-6 py-4 ${
                    i !== completed.length - 1 ? "kitchen-line" : ""
                  }`}
                >
                  <div>
                    <p className="font-medium text-[var(--color-ink)]">{s.title}</p>
                    <p className="text-sm text-[var(--color-ink-muted)]">{s.location}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-ink-muted)]">
                      {formatSessionDate(s.date_time)}
                    </p>
                    <Link
                      href={`/sessions/${s.id}/log-match`}
                      className="text-sm font-medium text-[var(--color-court)] hover:text-[var(--color-court-dark)]"
                    >
                      Log result
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
