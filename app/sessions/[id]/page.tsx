import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { RsvpButton } from "@/components/rsvp-button";
import { FixtureRoundNavigator } from "@/components/fixture-round-navigator";
import { SessionStandingsTable } from "@/components/session-standings-table";
import { ReadOnlyMatchCard } from "@/components/read-only-match-card";
import { ExportMatchesCsvButton } from "@/components/export-matches-csv-button";
import { computeStandings, sortStandings } from "@/lib/fixtures/standings";
import { formatSessionDate, formatSessionTime, toDarDateInputValue } from "@/lib/format";
import type { FixtureSettings, MatchSet } from "@/lib/types";

export default async function SessionDetailPage({
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
        <PageHeader eyebrow="Session" title="Session" />
        <div className="mx-auto mt-8 max-w-6xl px-6 pb-16">
          <EmptyState message="Your account needs admin approval first." />
        </div>
      </div>
    );
  }

  const { data: session } = await supabase
    .from("sessions")
    .select("id, title, date_time, location, capacity, status, fixture_settings, counts_toward_leaderboard")
    .eq("id", id)
    .single();

  if (!session) notFound();

  const { data: myRsvp } = await supabase
    .from("rsvps")
    .select("status")
    .eq("session_id", id)
    .eq("player_id", user.id)
    .maybeSingle();

  const { data: confirmedRsvps } = await supabase
    .from("rsvps")
    .select("player_id")
    .eq("session_id", id)
    .eq("status", "confirmed");
  const confirmedCount = (confirmedRsvps ?? []).length;
  const spotsLeft = Math.max(session.capacity - confirmedCount, 0);

  const { data: matchesData } = await supabase
    .from("matches")
    .select("id, team_a, team_b, sets, winning_team, verified, round_number, court_number")
    .eq("session_id", id)
    .eq("source", "fixture")
    .order("round_number", { ascending: true })
    .order("court_number", { ascending: true });
  const matches = matchesData ?? [];

  const playerIds = [...new Set(matches.flatMap((m) => [...m.team_a, ...m.team_b]))];
  const { data: playersData } = playerIds.length
    ? await supabase.from("players").select("id, name, dupr_id").in("id", playerIds)
    : { data: [] as { id: string; name: string; dupr_id: string | null }[] };
  const nameById = new Map((playersData ?? []).map((p) => [p.id, p.name]));
  const duprById = new Map((playersData ?? []).map((p) => [p.id, p.dupr_id]));
  const teamLabel = (ids: string[]) =>
    ids.map((pid) => nameById.get(pid) ?? "Unknown").join(" & ");

  const settings = session.fixture_settings as FixtureSettings | null;
  const hasFixtures = matches.length > 0;

  const roundsMap = new Map<number, typeof matches>();
  for (const m of matches) {
    const r = m.round_number ?? 0;
    if (!roundsMap.has(r)) roundsMap.set(r, []);
    roundsMap.get(r)!.push(m);
  }

  const standingsRows = settings
    ? sortStandings(
        [...computeStandings(matches, settings.scoring).values()],
        settings.rankBy,
        settings.tiebreak
      )
    : [];

  const myStatus: "confirmed" | "waitlisted" | "none" =
    myRsvp?.status === "confirmed" || myRsvp?.status === "waitlisted" ? myRsvp.status : "none";

  const roundsContent = [...roundsMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([roundNumber, roundMatches]) => ({
      roundNumber,
      content: (
        <div className="grid gap-4 sm:grid-cols-2">
          {roundMatches.map((m) => (
            <ReadOnlyMatchCard
              key={m.id}
              courtNumber={m.court_number}
              teamALabel={teamLabel(m.team_a)}
              teamBLabel={teamLabel(m.team_b)}
              sets={m.sets as MatchSet[]}
              verified={m.verified}
            />
          ))}
        </div>
      ),
    }));

  return (
    <div>
      <PageHeader
        eyebrow={session.status === "completed" ? "Previous session" : "Session"}
        title={session.title}
        subtitle={`${formatSessionDate(session.date_time)} · ${formatSessionTime(session.date_time)} · ${session.location}`}
      />
      <div className="mx-auto mt-8 max-w-6xl px-6 pb-16">
        {!session.counts_toward_leaderboard && (
          <div className="mb-6 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] px-5 py-3">
            <p className="text-sm text-[var(--color-ink-muted)]">
              This session&apos;s results don&apos;t count toward the season leaderboard.
            </p>
          </div>
        )}
        {session.status === "upcoming" && !hasFixtures && (
          <div className="mb-8 flex items-center justify-between rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-5">
            <p className="text-sm text-[var(--color-ink-muted)]">
              {spotsLeft > 0 ? `${spotsLeft} spots left` : "Full — waitlist open"}
            </p>
            <div className="w-40">
              <RsvpButton sessionId={session.id} initialStatus={myStatus} full={spotsLeft <= 0} />
            </div>
          </div>
        )}

        {!hasFixtures ? (
          <EmptyState message="Fixtures haven't been generated for this session yet." />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
            <section>
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
                  Standings
                </h2>
                {matches.some((m) => (m.sets as MatchSet[]).length > 0) && (
                  <ExportMatchesCsvButton
                    sessionTitle={session.title}
                    dateLabel={toDarDateInputValue(session.date_time)}
                    matches={matches}
                    nameById={nameById}
                    duprById={duprById}
                  />
                )}
              </div>
              <div className="mt-4">
                {settings && standingsRows.length > 0 ? (
                  <SessionStandingsTable
                    rows={standingsRows}
                    nameById={nameById}
                    scoring={settings.scoring}
                  />
                ) : (
                  <EmptyState message="No scores yet." />
                )}
              </div>
            </section>

            <section>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
                Rounds
                {settings && (
                  <span className="ml-2 font-[family-name:var(--font-mono)] text-sm font-normal normal-case text-[var(--color-ink-muted)]">
                    {settings.roundMinutesLabel}
                  </span>
                )}
              </h2>
              <div className="mt-4">
                <FixtureRoundNavigator rounds={roundsContent} />
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
