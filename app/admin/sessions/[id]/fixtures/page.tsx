import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { EmptyState } from "@/components/empty-state";
import { GenerateFixturesForm } from "@/components/admin/generate-fixtures-form";
import { AddParticipantForm } from "@/components/admin/add-participant-form";
import { FixtureMatchScoreForm } from "@/components/admin/fixture-match-score-form";
import { FixtureRoundNavigator } from "@/components/fixture-round-navigator";
import { SessionStandingsTable } from "@/components/session-standings-table";
import { computeStandings, sortStandings } from "@/lib/fixtures/standings";
import type { FixtureSettings, MatchSet } from "@/lib/types";

export default async function SessionFixturesPage({
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

  const { data: me } = await supabase
    .from("players")
    .select("role")
    .eq("id", user.id)
    .single();

  if (me?.role !== "admin") redirect("/dashboard");

  const { data: session } = await supabase
    .from("sessions")
    .select("id, title, date_time, location, courts, fixture_settings")
    .eq("id", id)
    .single();

  if (!session) notFound();

  const { data: rsvps } = await supabase
    .from("rsvps")
    .select("player_id")
    .eq("session_id", id)
    .eq("status", "confirmed");
  const confirmedIds = (rsvps ?? []).map((r) => r.player_id);

  const { data: confirmedPlayers } = confirmedIds.length
    ? await supabase.from("players").select("id, name").in("id", confirmedIds).order("name")
    : { data: [] as { id: string; name: string }[] };

  const { data: matchesData } = await supabase
    .from("matches")
    .select("id, team_a, team_b, sets, winning_team, verified, round_number, court_number")
    .eq("session_id", id)
    .eq("source", "fixture")
    .order("round_number", { ascending: true })
    .order("court_number", { ascending: true });
  const matches = matchesData ?? [];

  const playerIds = [
    ...new Set([...confirmedIds, ...matches.flatMap((m) => [...m.team_a, ...m.team_b])]),
  ];
  const { data: playersData } = playerIds.length
    ? await supabase.from("players").select("id, name").in("id", playerIds)
    : { data: [] as { id: string; name: string }[] };
  const nameById = new Map((playersData ?? []).map((p) => [p.id, p.name]));
  const teamLabel = (ids: string[]) =>
    ids.map((pid) => nameById.get(pid) ?? "Unknown").join(" & ");

  const { data: knownGuests } = await supabase
    .from("players")
    .select("id, name")
    .eq("is_guest", true)
    .eq("status", "approved")
    .order("name");

  const { data: allMembers } = await supabase
    .from("players")
    .select("id, name")
    .eq("status", "approved")
    .eq("is_guest", false)
    .order("name");
  const confirmedIdSet = new Set(confirmedIds);
  const addableMembers = (allMembers ?? []).filter((m) => !confirmedIdSet.has(m.id));

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

  const roundsContent = [...roundsMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([roundNumber, roundMatches]) => ({
      roundNumber,
      content: (
        <div className="grid gap-4 sm:grid-cols-2">
          {roundMatches.map((m) => (
            <div
              key={m.id}
              className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-5"
            >
              <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[var(--color-ink-muted)]">
                Court {m.court_number}
              </p>
              <p className="mt-1 text-[var(--color-ink)]">
                <span className="font-medium">{teamLabel(m.team_a)}</span>
                <span className="mx-2 text-[var(--color-ink-muted)]">vs</span>
                <span className="font-medium">{teamLabel(m.team_b)}</span>
              </p>
              <div className="mt-3">
                <FixtureMatchScoreForm
                  matchId={m.id}
                  sessionId={id}
                  teamALabel={teamLabel(m.team_a)}
                  teamBLabel={teamLabel(m.team_b)}
                  initialSets={m.sets as MatchSet[]}
                  verified={m.verified}
                />
              </div>
            </div>
          ))}
        </div>
      ),
    }));

  return (
    <div>
      <PageHeader eyebrow="Admin" title={`Fixtures — ${session.title}`} />
      <div className="mx-auto mt-8 max-w-6xl px-6 pb-16">
        <AdminTabs active="/admin/sessions" />

        {!hasFixtures ? (
          <div className="mt-6 grid gap-8 md:grid-cols-2">
            <section>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
                Add players
              </h2>
              <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6">
                <AddParticipantForm
                  sessionId={id}
                  addableMembers={addableMembers}
                  knownGuests={knownGuests ?? []}
                />
              </div>
              <div className="mt-4">
                <p className="text-xs uppercase tracking-widest text-[var(--color-ink-muted)]">
                  Confirmed ({confirmedPlayers?.length ?? 0})
                </p>
                {!confirmedPlayers || confirmedPlayers.length === 0 ? (
                  <p className="mt-2 text-sm text-[var(--color-ink-muted)]">Nobody yet.</p>
                ) : (
                  <p className="mt-2 text-sm text-[var(--color-ink)]">
                    {confirmedPlayers.map((p) => p.name).join(", ")}
                  </p>
                )}
              </div>
            </section>

            <section>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
                Generate fixtures
              </h2>
              <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6">
                <GenerateFixturesForm
                  sessionId={id}
                  defaultCourts={session.courts ?? 4}
                  confirmedCount={confirmedIds.length}
                />
              </div>
            </section>
          </div>
        ) : (
          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.3fr)]">
            <section>
              <div className="flex h-9 items-center">
                <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
                  Today&apos;s standings
                </h2>
              </div>
              <div className="mt-4">
                {settings && standingsRows.length > 0 ? (
                  <SessionStandingsTable
                    rows={standingsRows}
                    nameById={nameById}
                    scoring={settings.scoring}
                  />
                ) : (
                  <EmptyState message="No scores yet — standings fill in as rounds get played." />
                )}
              </div>
            </section>

            <section>
              <FixtureRoundNavigator
                title="Rounds"
                subtitle={settings?.roundMinutesLabel}
                rounds={roundsContent}
              />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
