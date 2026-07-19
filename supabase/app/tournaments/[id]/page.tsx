import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { SessionStandingsTable } from "@/components/session-standings-table";
import { computeStandings, sortStandings } from "@/lib/fixtures/standings";
import { formatSessionDate, formatSessionTime } from "@/lib/format";

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
        <PageHeader eyebrow="Round robin" title="Tournament" />
        <div className="mx-auto mt-8 max-w-3xl px-6 pb-16">
          <EmptyState message="Your account needs admin approval first." />
        </div>
      </div>
    );
  }

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id, name, start_date, end_date, scoring, rank_by, tiebreak")
    .eq("id", id)
    .single();

  if (!tournament) notFound();

  const [{ data: entries }, { data: sessions }] = await Promise.all([
    supabase.from("tournament_entries").select("player_id").eq("tournament_id", id),
    supabase
      .from("sessions")
      .select("id, title, date_time, location, status")
      .eq("tournament_id", id)
      .order("date_time", { ascending: true }),
  ]);

  const entryPlayerIds = (entries ?? []).map((e) => e.player_id);
  const { data: entryPlayers } = entryPlayerIds.length
    ? await supabase.from("players").select("id, name").in("id", entryPlayerIds).order("name")
    : { data: [] as { id: string; name: string }[] };

  const sessionIds = (sessions ?? []).map((s) => s.id);
  const { data: matches } = sessionIds.length
    ? await supabase
        .from("matches")
        .select("team_a, team_b, sets, winning_team, verified")
        .in("session_id", sessionIds)
        .eq("source", "fixture")
    : { data: [] };

  const nameById = new Map((entryPlayers ?? []).map((p) => [p.id, p.name]));
  const standingsRows = sortStandings(
    [...computeStandings(matches ?? [], tournament.scoring).values()],
    tournament.rank_by,
    tournament.tiebreak
  );

  return (
    <div>
      <PageHeader
        eyebrow="Round robin"
        title={tournament.name}
        subtitle={`${tournament.start_date} → ${tournament.end_date} · doesn't count toward the season leaderboard`}
      />
      <div className="mx-auto mt-8 max-w-6xl px-6 pb-16">
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
            Standings
          </h2>
          <div className="mt-4">
            {standingsRows.length > 0 ? (
              <SessionStandingsTable
                rows={standingsRows}
                nameById={nameById}
                scoring={tournament.scoring}
              />
            ) : (
              <EmptyState message="No scores yet." />
            )}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
            Weekly sessions
          </h2>
          <div className="mt-4">
            {!sessions || sessions.length === 0 ? (
              <EmptyState message="No sessions scheduled yet." />
            ) : (
              <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)]">
                {sessions.map((s, i) => (
                  <Link
                    key={s.id}
                    href={`/sessions/${s.id}`}
                    className={`flex items-center justify-between px-6 py-4 transition-colors hover:bg-[var(--color-paper)] ${
                      i !== sessions.length - 1 ? "kitchen-line" : ""
                    }`}
                  >
                    <div>
                      <p className="font-medium text-[var(--color-ink)]">{s.title}</p>
                      <p className="text-sm text-[var(--color-ink-muted)]">{s.location}</p>
                    </div>
                    <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-ink-muted)]">
                      {formatSessionDate(s.date_time)} · {formatSessionTime(s.date_time)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
            Registered ({entryPlayers?.length ?? 0})
          </h2>
          <div className="mt-4">
            {!entryPlayers || entryPlayers.length === 0 ? (
              <EmptyState message="No one registered yet." />
            ) : (
              <p className="text-sm text-[var(--color-ink)]">
                {entryPlayers.map((p) => p.name).join(", ")}
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
