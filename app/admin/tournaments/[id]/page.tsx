import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { EmptyState } from "@/components/empty-state";
import { AddTournamentEntryForm } from "@/components/admin/add-tournament-entry-form";
import { TournamentEntryRow } from "@/components/admin/tournament-entry-row";
import { SessionStandingsTable } from "@/components/session-standings-table";
import { computeStandings, sortStandings } from "@/lib/fixtures/standings";
import { ExportDuprCsvButton, type DuprMatchRow } from "@/components/admin/export-dupr-csv-button";
import { formatSessionDate, formatSessionTime, toDarDateInputValue } from "@/lib/format";

export default async function AdminTournamentPage({
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

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id, name, start_date, end_date, scoring, rank_by, tiebreak")
    .eq("id", id)
    .single();

  if (!tournament) notFound();

  const [{ data: entries }, { data: sessions }, { data: allPlayers }] = await Promise.all([
    supabase.from("tournament_entries").select("player_id").eq("tournament_id", id),
    supabase
      .from("sessions")
      .select("id, title, date_time, location, status")
      .eq("tournament_id", id)
      .order("date_time", { ascending: true }),
    supabase
      .from("players")
      .select("id, name")
      .eq("status", "approved")
      .eq("is_guest", false)
      .order("name"),
  ]);

  const entryPlayerIds = new Set((entries ?? []).map((e) => e.player_id));
  const entryPlayers = (allPlayers ?? []).filter((p) => entryPlayerIds.has(p.id));
  const candidates = (allPlayers ?? []).filter((p) => !entryPlayerIds.has(p.id));

  const sessionIds = (sessions ?? []).map((s) => s.id);
  const { data: matches } = sessionIds.length
    ? await supabase
        .from("matches")
        .select("session_id, team_a, team_b, sets, winning_team, verified")
        .in("session_id", sessionIds)
        .eq("source", "fixture")
    : { data: [] };

  const matchPlayerIds = [
    ...new Set((matches ?? []).flatMap((m) => [...m.team_a, ...m.team_b])),
  ];
  const { data: matchPlayers } = matchPlayerIds.length
    ? await supabase.from("players").select("id, name, dupr_id").in("id", matchPlayerIds)
    : { data: [] as { id: string; name: string; dupr_id: string | null }[] };
  const duprById = new Map((matchPlayers ?? []).map((p) => [p.id, p.dupr_id]));
  const matchNameById = new Map((matchPlayers ?? []).map((p) => [p.id, p.name]));
  const sessionInfoById = new Map(
    (sessions ?? []).map((s) => [s.id, { date: toDarDateInputValue(s.date_time), location: s.location }])
  );

  const nameById = new Map((allPlayers ?? []).map((p) => [p.id, p.name]));
  const standingsRows = sortStandings(
    [...computeStandings(matches ?? [], tournament.scoring).values()],
    tournament.rank_by,
    tournament.tiebreak
  );

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title={tournament.name}
        subtitle={`${tournament.start_date} → ${tournament.end_date} · Round robin`}
      />
      <div className="mx-auto mt-8 max-w-6xl px-6 pb-16">
        <AdminTabs active="/admin/tournaments" />

        <div className="mt-6 flex justify-end">
          <Link
            href={`/admin/sessions/new?tournament=${id}`}
            className="rounded-[var(--radius-pill)] bg-[var(--color-court)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)]"
          >
            Create this week&apos;s session
          </Link>
        </div>

        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
              Standings
            </h2>
            {(matches ?? []).some((m) => (m.sets as { a: number; b: number }[]).length > 0) && (
              <ExportDuprCsvButton
                event={tournament.name}
                fileNameHint={tournament.name}
                matches={(matches ?? [])
                  .filter((m) => m.team_a.length === 2 && m.team_b.length === 2)
                  .map((m): DuprMatchRow => {
                    const info = sessionInfoById.get(m.session_id);
                    return {
                      date: info?.date ?? "",
                      location: info?.location ?? "",
                      teamA: m.team_a,
                      teamB: m.team_b,
                      sets: m.sets as { a: number; b: number }[],
                    };
                  })}
                nameById={matchNameById}
                duprById={duprById}
              />
            )}
          </div>
          <div className="mt-4">
            {standingsRows.length > 0 ? (
              <SessionStandingsTable
                rows={standingsRows}
                nameById={nameById}
                scoring={tournament.scoring}
              />
            ) : (
              <EmptyState message="No scores yet — standings fill in once weekly sessions are played." />
            )}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
            Weekly sessions
          </h2>
          <div className="mt-4">
            {!sessions || sessions.length === 0 ? (
              <EmptyState message="No sessions created for this tournament yet." />
            ) : (
              <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)]">
                {sessions.map((s, i) => (
                  <Link
                    key={s.id}
                    href={`/admin/sessions/${s.id}/fixtures`}
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
            Registered players ({entryPlayers.length})
          </h2>
          <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6">
            <AddTournamentEntryForm tournamentId={id} candidates={candidates} />
            {entryPlayers.length > 0 && (
              <div className="kitchen-line mt-4 divide-y divide-[var(--color-line)] pt-2">
                {entryPlayers.map((p) => (
                  <TournamentEntryRow
                    key={p.id}
                    tournamentId={id}
                    playerId={p.id}
                    name={p.name}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
