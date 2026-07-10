import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { GenerateFixturesForm } from "@/components/admin/generate-fixtures-form";
import { AddGuestForm } from "@/components/admin/add-guest-form";
import { FixtureMatchScoreForm } from "@/components/admin/fixture-match-score-form";
import { computeSameDayStandings, sortStandings } from "@/lib/fixtures/standings";
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
    .order("name");

  const settings = session.fixture_settings as FixtureSettings | null;
  const hasFixtures = matches.length > 0;

  const rounds = new Map<number, typeof matches>();
  for (const m of matches) {
    const r = m.round_number ?? 0;
    if (!rounds.has(r)) rounds.set(r, []);
    rounds.get(r)!.push(m);
  }

  const standingsRows = settings
    ? sortStandings(
        [...computeSameDayStandings(matches, settings.scoring).values()],
        settings.rankBy,
        settings.tiebreak
      )
    : [];

  return (
    <div>
      <PageHeader eyebrow="Admin" title={`Fixtures — ${session.title}`} />
      <div className="mx-auto mt-8 max-w-6xl px-6 pb-16">
        <AdminTabs active="/admin/sessions" />

        {!hasFixtures ? (
          <div className="mt-6 grid gap-8 md:grid-cols-2">
            <section>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
                Add a guest
              </h2>
              <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6">
                <AddGuestForm sessionId={id} knownGuests={knownGuests ?? []} />
              </div>
              <p className="mt-3 text-sm text-[var(--color-ink-muted)]">
                {confirmedIds.length} player{confirmedIds.length === 1 ? "" : "s"} confirmed for
                this session (add guests here before generating).
              </p>
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
          <div className="mt-6 space-y-10">
            {settings && standingsRows.length > 0 && (
              <section>
                <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
                  Today&apos;s standings
                </h2>
                <div className="mt-4 overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)]">
                  <table className="w-full min-w-[420px] text-left">
                    <thead>
                      <tr className="kitchen-line font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[var(--color-ink-muted)]">
                        <th className="px-6 py-3">#</th>
                        <th className="px-6 py-3">Player</th>
                        <th className="px-6 py-3 text-right">W</th>
                        <th className="px-6 py-3 text-right">L</th>
                        {settings.scoring === "points" && (
                          <th className="px-6 py-3 text-right">Pts</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {standingsRows.map((row, i) => (
                        <tr
                          key={row.playerId}
                          className="border-b border-[var(--color-line)] last:border-0"
                        >
                          <td className="px-6 py-3 font-[family-name:var(--font-mono)] text-[var(--color-ink-muted)]">
                            {i + 1}
                          </td>
                          <td className="px-6 py-3 font-medium text-[var(--color-ink)]">
                            {nameById.get(row.playerId) ?? "Unknown"}
                          </td>
                          <td className="px-6 py-3 text-right font-[family-name:var(--font-mono)]">
                            {row.wins}
                          </td>
                          <td className="px-6 py-3 text-right font-[family-name:var(--font-mono)]">
                            {row.losses}
                          </td>
                          {settings.scoring === "points" && (
                            <td className="px-6 py-3 text-right font-[family-name:var(--font-mono)] font-semibold text-[var(--color-court)]">
                              {row.points}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {[...rounds.entries()]
              .sort(([a], [b]) => a - b)
              .map(([roundNum, roundMatches]) => (
                <section key={roundNum}>
                  <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
                    Round {roundNum}
                    {settings && (
                      <span className="ml-2 font-[family-name:var(--font-mono)] text-sm font-normal normal-case text-[var(--color-ink-muted)]">
                        {settings.roundMinutesLabel}
                      </span>
                    )}
                  </h2>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
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
                </section>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
