import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { RsvpButton } from "@/components/rsvp-button";
import { SessionCapacityMeter } from "@/components/session-capacity-meter";
import { AddGuestModal } from "@/components/add-guest-modal";
import { NoShowModal } from "@/components/no-show-modal";
import { FixtureRoundNavigator } from "@/components/fixture-round-navigator";
import { SessionStandingsTable } from "@/components/session-standings-table";
import { ReadOnlyMatchCard } from "@/components/read-only-match-card";
import { ExportMatchesCsvButton } from "@/components/export-matches-csv-button";
import { computeStandings, sortStandings } from "@/lib/fixtures/standings";
import { formatSessionDate, formatSessionTime, toDarDateInputValue, displayName } from "@/lib/format";
import type { FixtureSettings, MatchSet } from "@/lib/types";

export async function SessionDetail({
  id,
  compact = false,
}: {
  id: string;
  compact?: boolean;
}) {
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
        {!compact && <PageHeader eyebrow="Session" title="Session" />}
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
  const confirmedIds = (confirmedRsvps ?? []).map((r) => r.player_id);
  const confirmedCount = confirmedIds.length;
  const spotsLeft = Math.max(session.capacity - confirmedCount, 0);

  const { data: confirmedPlayersData } = confirmedIds.length
    ? await supabase.from("players").select("id, name, nickname, is_guest").in("id", confirmedIds)
    : { data: [] as { id: string; name: string; nickname: string | null; is_guest: boolean }[] };
  const confirmedNames = (confirmedPlayersData ?? [])
    .map((p) => (p.is_guest ? `${displayName(p)} (G)` : displayName(p)))
    .sort((a, b) => a.localeCompare(b));

  const isStaff = player?.role === "admin" || player?.role === "manager";

  const { data: knownGuests } = isStaff
    ? await supabase.from("players").select("id, name").eq("is_guest", true).eq("status", "approved").order("name")
    : { data: [] as { id: string; name: string }[] };

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
    ? await supabase.from("players").select("id, name, nickname, dupr_id").in("id", playerIds)
    : { data: [] as { id: string; name: string; nickname: string | null; dupr_id: string | null }[] };
  const nameById = new Map((playersData ?? []).map((p) => [p.id, displayName(p)]));
  const legalNameById = new Map((playersData ?? []).map((p) => [p.id, p.name]));
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
    .map(([roundNumber, roundMatches]) => {
      const playingIds = new Set(roundMatches.flatMap((m) => [...m.team_a, ...m.team_b]));
      const sittingOut = confirmedIds
        .filter((pid) => !playingIds.has(pid))
        .map((pid) => nameById.get(pid) ?? "Unknown")
        .sort((a, b) => a.localeCompare(b));

      return {
        roundNumber,
        content: (
          <div>
            {sittingOut.length > 0 && (
              <p className="mb-4 text-sm text-[var(--color-ink-muted)]">
                <span className="font-medium text-[var(--color-ink)]">Sitting out:</span>{" "}
                {sittingOut.join(", ")}
              </p>
            )}
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
          </div>
        ),
      };
    });

  return (
    <div>
      {compact ? (
        <div className="px-6 pt-6">
          <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[var(--color-court)]">
            {session.status === "completed" ? "Previous session" : "Session"}
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-extrabold uppercase tracking-tight text-[var(--color-ink)]">
            {session.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            {formatSessionDate(session.date_time)} · {formatSessionTime(session.date_time)} ·{" "}
            {session.location}
          </p>
        </div>
      ) : (
        <PageHeader
          eyebrow={session.status === "completed" ? "Previous session" : "Session"}
          title={session.title}
          subtitle={`${formatSessionDate(session.date_time)} · ${formatSessionTime(session.date_time)} · ${session.location}`}
        />
      )}
      <div className={compact ? "mx-auto mt-4 max-w-6xl px-6 pb-6" : "mx-auto mt-8 max-w-6xl px-6 pb-16"}>
        {(!session.counts_toward_leaderboard || isStaff) && (
          <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
            {!session.counts_toward_leaderboard && (
              <span className="rounded-[var(--radius-pill)] border border-[var(--color-line)] px-3 py-1 text-xs text-[var(--color-ink-muted)]">
                Doesn&apos;t count toward the season leaderboard
              </span>
            )}
            {isStaff && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[var(--color-ink-muted)]">
                  Staff
                </span>
                <Link
                  href={`/admin/sessions/${session.id}/edit`}
                  className="font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-court)]"
                >
                  Edit session
                </Link>
                <span className="text-[var(--color-line)]">·</span>
                <Link
                  href={`/admin/sessions/${session.id}/fixtures`}
                  className="font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-court)]"
                >
                  Fixtures
                </Link>
                <span className="text-[var(--color-line)]">·</span>
                <NoShowModal
                  sessionId={session.id}
                  triggerLabel="No-shows"
                  triggerClassName="font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-court)]"
                />
              </div>
            )}
          </div>
        )}

        {/* Signature module: who's on court, and whether there's room */}
        <div id="add-guest" className="mb-8 rounded-[var(--radius-card)] border border-[var(--color-court)]/30 bg-[var(--color-paper-raised)] p-6 scroll-mt-24">
          {session.status === "upcoming" && !hasFixtures && (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex-1">
                <SessionCapacityMeter capacity={session.capacity} filled={confirmedCount} />
              </div>
              <div className="w-full sm:w-44">
                <RsvpButton sessionId={session.id} initialStatus={myStatus} full={spotsLeft <= 0} />
              </div>
            </div>
          )}

          <div className={session.status === "upcoming" && !hasFixtures ? "kitchen-line mt-5 pt-5" : ""}>
            <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[var(--color-ink-muted)]">
              Confirmed ({confirmedNames.length})
            </p>
            {confirmedNames.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--color-ink-muted)]">Nobody yet.</p>
            ) : (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {confirmedNames.map((name) => (
                  <span
                    key={name}
                    className="rounded-[var(--radius-pill)] border border-[var(--color-line)] bg-[var(--color-paper)] px-2.5 py-1 text-xs font-medium text-[var(--color-ink)]"
                  >
                    {name}
                  </span>
                ))}
              </div>
            )}
            {isStaff && (
              <AddGuestModal
                sessionId={session.id}
                knownGuestNames={(knownGuests ?? []).map((g) => g.name)}
                triggerLabel="+ Add guest"
                triggerClassName="mt-3 text-sm font-medium text-[var(--color-court)] hover:text-[var(--color-court-dark)]"
              />
            )}
          </div>
        </div>

        {player?.role === "admin" && hasFixtures && matches.some((m) => (m.sets as MatchSet[]).length > 0) && (
          <div className="mb-8 flex justify-end">
            <ExportMatchesCsvButton
              sessionTitle={session.title}
              dateLabel={toDarDateInputValue(session.date_time)}
              matches={matches}
              nameById={legalNameById}
              duprById={duprById}
            />
          </div>
        )}

        {!hasFixtures ? (
          <EmptyState message="Fixtures haven't been generated for this session yet." />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.3fr)]">
            <section>
              <div className="flex h-9 items-center">
                <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
                  Standings
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
                  <EmptyState message="No scores yet." />
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
