import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ProfileOverview } from "@/components/profile-overview";
import { formatSessionDate, formatSessionTime, formatTZS } from "@/lib/format";
import type { MatchSet } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: player } = await supabase
    .from("players")
    .select("name, phone, status, skill_tier, points, wins, losses")
    .eq("id", user.id)
    .single();

  if (player?.status === "pending") {
    return (
      <div>
        <PageHeader eyebrow="Your dashboard" title="Almost on the roster" />
        <div className="mx-auto mt-8 max-w-6xl px-6 pb-16">
          <EmptyState message="Your account is waiting on admin approval. You'll be able to say I'm in for sessions and see the leaderboard once that's done." />
        </div>
      </div>
    );
  }

  const { data: myRsvps } = await supabase
    .from("rsvps")
    .select("status, sessions!inner(id, title, date_time, location, status)")
    .eq("player_id", user.id)
    .in("status", ["confirmed", "waitlisted"])
    .eq("sessions.status", "upcoming")
    .order("date_time", { referencedTable: "sessions", ascending: true });

  const { data: myMatches } = await supabase
    .from("matches")
    .select("id, session_id, team_a, team_b, sets, winning_team, verified, created_at")
    .or(`team_a.cs.{${user.id}},team_b.cs.{${user.id}}`)
    .order("created_at", { ascending: false })
    .limit(10);

  const matchSessionIds = [...new Set((myMatches ?? []).map((m) => m.session_id))];
  const matchPlayerIds = [
    ...new Set((myMatches ?? []).flatMap((m) => [...m.team_a, ...m.team_b])),
  ];

  const [{ data: matchSessions }, { data: matchPlayers }] = await Promise.all([
    matchSessionIds.length
      ? supabase.from("sessions").select("id, title, date_time").in("id", matchSessionIds)
      : Promise.resolve({ data: [] as { id: string; title: string; date_time: string }[] }),
    matchPlayerIds.length
      ? supabase.from("players").select("id, name").in("id", matchPlayerIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  const matchSessionById = new Map((matchSessions ?? []).map((s) => [s.id, s]));
  const matchPlayerNameById = new Map((matchPlayers ?? []).map((p) => [p.id, p.name]));

  const { data: myPayments } = await supabase
    .from("payments")
    .select("id, type, amount, status, period, session_id")
    .eq("player_id", user.id)
    .order("created_at", { ascending: false });

  const paymentSessionIds = [
    ...new Set((myPayments ?? []).map((p) => p.session_id).filter(Boolean)),
  ] as string[];
  const { data: paymentSessions } = paymentSessionIds.length
    ? await supabase.from("sessions").select("id, title").in("id", paymentSessionIds)
    : { data: [] as { id: string; title: string }[] };
  const paymentSessionTitleById = new Map((paymentSessions ?? []).map((s) => [s.id, s.title]));

  return (
    <div>
      <PageHeader
        eyebrow="Your dashboard"
        title={`Hey, ${player?.name?.split(" ")[0] ?? "there"}`}
      />
      <div className="mx-auto mt-8 max-w-6xl px-6 pb-16">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Points" value={player?.points ?? 0} />
          <StatCard label="Wins" value={player?.wins ?? 0} />
          <StatCard label="Losses" value={player?.losses ?? 0} />
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <div className="space-y-8">
            <section>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
                Profile
              </h2>
              <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6">
                <ProfileOverview
                  name={player?.name ?? ""}
                  phone={player?.phone ?? null}
                  skillTier={player?.skill_tier ?? null}
                />
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
                Your upcoming sessions
              </h2>
              <div className="mt-4">
                {!myRsvps || myRsvps.length === 0 ? (
                  <EmptyState message="Nothing yet — head to Sessions and say you're in." />
                ) : (
                  <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)]">
                    {myRsvps.map((r, i) => {
                      const session = Array.isArray(r.sessions) ? r.sessions[0] : r.sessions;
                      if (!session) return null;
                      return (
                        <div
                          key={session.id}
                          className={`flex items-center justify-between px-5 py-4 ${
                            i !== myRsvps.length - 1 ? "kitchen-line" : ""
                          }`}
                        >
                          <div>
                            <p className="font-medium text-[var(--color-ink)]">{session.title}</p>
                            <p className="text-sm text-[var(--color-ink-muted)]">
                              {formatSessionDate(session.date_time)} ·{" "}
                              {formatSessionTime(session.date_time)}
                            </p>
                          </div>
                          {r.status === "waitlisted" && (
                            <span className="shrink-0 rounded-[var(--radius-pill)] border border-[var(--color-ball)] bg-[var(--color-ball)]/30 px-3 py-1 text-xs font-semibold text-[var(--color-ink)]">
                              Waitlisted
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            <section>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
                Payments
              </h2>
              <div className="mt-4">
                {!myPayments || myPayments.length === 0 ? (
                  <EmptyState message="No charges on your account." />
                ) : (
                  <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)]">
                    {myPayments.map((p, i) => (
                      <div
                        key={p.id}
                        className={`flex items-center justify-between px-5 py-4 ${
                          i !== myPayments.length - 1 ? "kitchen-line" : ""
                        }`}
                      >
                        <div>
                          <p className="font-medium text-[var(--color-ink)]">
                            {p.type === "session_fee"
                              ? (paymentSessionTitleById.get(p.session_id ?? "") ?? "Session fee")
                              : `Membership · ${p.period}`}
                          </p>
                          <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-ink-muted)]">
                            {formatTZS(p.amount)}
                          </p>
                        </div>
                        <span
                          className={
                            p.status === "paid"
                              ? "shrink-0 rounded-[var(--radius-pill)] bg-[var(--color-court)] px-3 py-1 text-xs font-semibold text-white"
                              : "shrink-0 rounded-[var(--radius-pill)] border border-[var(--color-ball)] bg-[var(--color-ball)]/30 px-3 py-1 text-xs font-semibold text-[var(--color-ink)]"
                          }
                        >
                          {p.status === "paid" ? "Paid" : "Due"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
                Match history
              </h2>
              <div className="mt-4">
                {!myMatches || myMatches.length === 0 ? (
                  <EmptyState message="No matches logged yet — results show up here once you play a session." />
                ) : (
                  <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)]">
                    {myMatches.map((m, i) => {
                      const onTeamA = m.team_a.includes(user.id);
                      const opponentIds = onTeamA ? m.team_b : m.team_a;
                      const opponentNames =
                        opponentIds
                          .map((id: string) => matchPlayerNameById.get(id) ?? "Unknown")
                          .join(" & ") || "Unknown";
                      const session = matchSessionById.get(m.session_id);
                      const setsLabel = (m.sets as MatchSet[])
                        .map((s) => (onTeamA ? `${s.a}-${s.b}` : `${s.b}-${s.a}`))
                        .join(", ");
                      const iWon =
                        (onTeamA && m.winning_team === "a") ||
                        (!onTeamA && m.winning_team === "b");

                      return (
                        <div
                          key={m.id}
                          className={`flex items-center justify-between px-5 py-4 ${
                            i !== myMatches.length - 1 ? "kitchen-line" : ""
                          }`}
                        >
                          <div>
                            <p className="font-medium text-[var(--color-ink)]">
                              vs {opponentNames}
                            </p>
                            <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-ink-muted)]">
                              {setsLabel}
                              {session ? ` · ${formatSessionDate(session.date_time)}` : ""}
                            </p>
                          </div>
                          {!m.verified ? (
                            <span className="shrink-0 rounded-[var(--radius-pill)] border border-[var(--color-ball)] bg-[var(--color-ball)]/30 px-3 py-1 text-xs font-semibold text-[var(--color-ink)]">
                              Pending
                            </span>
                          ) : (
                            <span
                              className={
                                iWon
                                  ? "shrink-0 rounded-[var(--radius-pill)] bg-[var(--color-court)] px-3 py-1 text-xs font-semibold text-white"
                                  : "shrink-0 rounded-[var(--radius-pill)] border border-[var(--color-line)] px-3 py-1 text-xs font-semibold text-[var(--color-ink-muted)]"
                              }
                            >
                              {iWon ? "Win" : "Loss"}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6">
      <p className="text-xs uppercase tracking-widest text-[var(--color-ink-muted)]">
        {label}
      </p>
      <p className="mt-1 font-[family-name:var(--font-mono)] text-4xl font-semibold text-[var(--color-ink)]">
        {value}
      </p>
    </div>
  );
}
