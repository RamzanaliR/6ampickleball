import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { SessionCard } from "@/components/session-card";
import { formatSessionDate, formatSessionTime, displayName } from "@/lib/format";

type RsvpState = "confirmed" | "waitlisted" | "none";

export default async function SessionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: player } = await supabase
    .from("players")
    .select("status, role")
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
    .select("id, title, date_time, location, capacity, status, counts_toward_leaderboard")
    .in("status", ["upcoming", "completed"])
    .order("date_time", { ascending: true });

  const allUpcoming = (sessions ?? []).filter((s) => s.status === "upcoming");
  const previous = (sessions ?? [])
    .filter((s) => s.status === "completed")
    .slice(-20)
    .reverse();

  const sessionIds = (sessions ?? []).map((s) => s.id);

  const [{ data: rsvps }, { data: fixtureMatches }] = await Promise.all([
    sessionIds.length
      ? supabase
          .from("rsvps")
          .select("session_id, player_id, status")
          .in("session_id", sessionIds)
          .in("status", ["confirmed", "waitlisted"])
      : Promise.resolve({ data: [] }),
    sessionIds.length
      ? supabase
          .from("matches")
          .select("session_id")
          .in("session_id", sessionIds)
          .eq("source", "fixture")
      : Promise.resolve({ data: [] }),
  ]);

  const confirmedPlayerIds = [
    ...new Set((rsvps ?? []).filter((r) => r.status === "confirmed").map((r) => r.player_id)),
  ];
  const { data: confirmedPlayersData } = confirmedPlayerIds.length
    ? await supabase.from("players").select("id, name, nickname").in("id", confirmedPlayerIds)
    : { data: [] as { id: string; name: string; nickname: string | null }[] };
  const nameById = new Map((confirmedPlayersData ?? []).map((p) => [p.id, displayName(p)]));

  const sessionsWithFixtures = new Set((fixtureMatches ?? []).map((m) => m.session_id));

  const current = allUpcoming.filter((s) => sessionsWithFixtures.has(s.id));
  const upcoming = allUpcoming.filter((s) => !sessionsWithFixtures.has(s.id));

  const confirmedCountBySession = new Map<string, number>();
  const confirmedNamesBySession = new Map<string, string[]>();
  const myStatusBySession = new Map<string, RsvpState>();
  for (const r of rsvps ?? []) {
    if (r.status === "confirmed") {
      confirmedCountBySession.set(
        r.session_id,
        (confirmedCountBySession.get(r.session_id) ?? 0) + 1
      );
      const list = confirmedNamesBySession.get(r.session_id) ?? [];
      list.push(nameById.get(r.player_id) ?? "Unknown");
      confirmedNamesBySession.set(r.session_id, list);
    }
    if (r.player_id === user.id) {
      myStatusBySession.set(r.session_id, r.status as RsvpState);
    }
  }
  for (const names of confirmedNamesBySession.values()) {
    names.sort((a, b) => a.localeCompare(b));
  }

  const isStaff = player?.role === "admin" || player?.role === "manager";

  const { data: knownGuestsData } = isStaff
    ? await supabase.from("players").select("name").eq("is_guest", true).eq("status", "approved").order("name")
    : { data: [] as { name: string }[] };
  const knownGuestNames = (knownGuestsData ?? []).map((g) => g.name);

  return (
    <div>
      <PageHeader
        eyebrow="This week & beyond"
        title="Sessions"
        subtitle="Say I'm in before spots fill — the waitlist kicks in automatically."
        action={
          isStaff ? (
            <Link
              href="/admin/sessions/new"
              className="rounded-[var(--radius-pill)] bg-[var(--color-court)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)]"
            >
              + New session
            </Link>
          ) : undefined
        }
      />
      <div className="mx-auto mt-8 max-w-6xl space-y-12 px-6 pb-16">
        <div className="grid gap-8 md:grid-cols-2">
          <section>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
              Current
            </h2>
            <div className="mt-4">
              {current.length === 0 ? (
                <EmptyState message="No session in progress right now." />
              ) : (
                <div className="space-y-4">
                  {current.map((s) => (
                    <SessionCard
                      key={s.id}
                      session={s}
                      spotsLeft={0}
                      myStatus={myStatusBySession.get(s.id) ?? "none"}
                      confirmedNames={confirmedNamesBySession.get(s.id) ?? []}
                      isStaff={isStaff}
                      knownGuestNames={knownGuestNames}
                      variant="current"
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
              Upcoming
            </h2>
            <div className="mt-4">
              {upcoming.length === 0 ? (
                <EmptyState message="No sessions scheduled yet — check back soon." />
              ) : (
                <div className="space-y-4">
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
                        confirmedNames={confirmedNamesBySession.get(s.id) ?? []}
                        isStaff={isStaff}
                        knownGuestNames={knownGuestNames}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>

        {previous.length > 0 && (
          <section>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
              Previous
            </h2>
            <div className="mt-4 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)]">
              {previous.map((s, i) => (
                <div
                  key={s.id}
                  className={`flex items-center justify-between px-6 py-4 ${
                    i !== previous.length - 1 ? "kitchen-line" : ""
                  }`}
                >
                  <Link href={`/sessions/${s.id}`} className="min-w-0 flex-1">
                    <p className="font-medium text-[var(--color-ink)] hover:text-[var(--color-court)]">
                      {s.title}
                    </p>
                    <p className="text-sm text-[var(--color-ink-muted)]">{s.location}</p>
                    {!s.counts_toward_leaderboard && (
                      <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
                        Not counted on leaderboard
                      </p>
                    )}
                  </Link>
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
