import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ProfileOverview } from "@/components/profile-overview";
import { MatchHistoryList } from "@/components/match-history-list";
import { formatSessionDate, formatSessionTime, formatTZS, displayName } from "@/lib/format";
import type { MatchSet } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: player } = await supabase
    .from("players")
    .select("name, nickname, phone, status, skill_tier, dupr_id, points, wins, losses")
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
      ? supabase.from("players").select("id, name, nickname").in("id", matchPlayerIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  const matchSessionById = new Map((matchSessions ?? []).map((s) => [s.id, s]));
  const matchPlayerNameById = new Map(
    (matchPlayers ?? []).map((p) => [p.id, displayName(p)])
  );

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
        title={`Hey, ${(player ? displayName(player) : "").split(" ")[0] || "there"}`}
      />
      <div className="mx-auto mt-8 max-w-6xl px-6 pb-16">
        <div className="grid grid-cols-3 divide-x divide-[var(--color-line)] overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)]">
          <StatCard label="Points" value={player?.points ?? 0} />
          <StatCard label="Wins" value={player?.wins ?? 0} />
          <StatCard label="Losses" value={player?.losses ?? 0} />
        </div>

        {/* Source order = mobile stacking order (Upcoming, Profile, Match history, Payments).
            md:grid-cols-2 turns this into a 2x2 layout on larger screens with no extra
            order overrides needed. */}
        <div className="mt-8 flex flex-col gap-8 md:grid md:grid-cols-2">
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
                      <Link
                        key={session.id}
                        href={`/sessions/${session.id}`}
                        className={`flex items-center justify-between px-5 py-4 transition-colors hover:bg-[var(--color-paper)] ${
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
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
              Profile
            </h2>
            <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6">
              <ProfileOverview
                name={player?.name ?? ""}
                nickname={player?.nickname ?? null}
                phone={player?.phone ?? null}
                skillTier={player?.skill_tier ?? null}
                duprId={player?.dupr_id ?? null}
              />
            </div>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
              Match history
            </h2>
            <div className="mt-4">
              <MatchHistoryList
                items={(myMatches ?? []).map((m) => {
                  const onTeamA = m.team_a.includes(user.id);
                  const opponentIds = onTeamA ? m.team_b : m.team_a;
                  const opponentLabel =
                    opponentIds
                      .map((pid: string) => matchPlayerNameById.get(pid) ?? "Unknown")
                      .join(" & ") || "Unknown";
                  const session = matchSessionById.get(m.session_id);
                  const setsLabel = (m.sets as MatchSet[])
                    .map((s) => (onTeamA ? `${s.a}-${s.b}` : `${s.b}-${s.a}`))
                    .join(", ");
                  const iWon =
                    (onTeamA && m.winning_team === "a") ||
                    (!onTeamA && m.winning_team === "b");

                  return {
                    id: m.id,
                    opponentLabel,
                    setsLabel,
                    sessionId: session?.id ?? null,
                    sessionLabel: session ? formatSessionDate(session.date_time) : null,
                    sessionDateTime: session?.date_time ?? null,
                    outcome: !m.verified ? "pending" : iWon ? "win" : "loss",
                  };
                })}
                emptyMessage="No matches logged yet — results show up here once you play a session."
              />
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
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-2 py-3 text-center sm:px-4 sm:py-4">
      <p className="text-[10px] uppercase tracking-widest text-[var(--color-ink-muted)] sm:text-xs">
        {label}
      </p>
      <p className="mt-0.5 font-[family-name:var(--font-mono)] text-xl font-semibold text-[var(--color-ink)] sm:text-2xl">
        {value}
      </p>
    </div>
  );
}
