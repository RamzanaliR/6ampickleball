import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { MatchHistoryList } from "@/components/match-history-list";
import { formatSessionDate } from "@/lib/format";
import type { MatchSet } from "@/lib/types";

export default async function PlayerProfilePage({
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
    .select("id, name, skill_tier, dupr_id, points, wins, losses, status, is_guest")
    .eq("id", id)
    .single();

  if (!player || player.status !== "approved" || player.is_guest) notFound();

  const { data: matches } = await supabase
    .from("matches")
    .select("id, session_id, team_a, team_b, sets, winning_team, verified, created_at")
    .or(`team_a.cs.{${id}},team_b.cs.{${id}}`)
    .eq("verified", true)
    .order("created_at", { ascending: false })
    .limit(20);

  const sessionIds = [...new Set((matches ?? []).map((m) => m.session_id))];
  const playerIds = [...new Set((matches ?? []).flatMap((m) => [...m.team_a, ...m.team_b]))];

  const [{ data: sessions }, { data: players }] = await Promise.all([
    sessionIds.length
      ? supabase.from("sessions").select("id, title, date_time").in("id", sessionIds)
      : Promise.resolve({ data: [] as { id: string; title: string; date_time: string }[] }),
    playerIds.length
      ? supabase.from("players").select("id, name").in("id", playerIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  const sessionById = new Map((sessions ?? []).map((s) => [s.id, s]));
  const nameById = new Map((players ?? []).map((p) => [p.id, p.name]));

  return (
    <div>
      <PageHeader eyebrow="Player" title={player.name} />
      <div className="mx-auto mt-8 max-w-6xl px-6 pb-16">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Points" value={player.points} />
          <StatCard label="Wins" value={player.wins} />
          <StatCard label="Losses" value={player.losses} />
          <StatCard label="Games" value={player.wins + player.losses} />
        </div>
        {(player.skill_tier || player.dupr_id) && (
          <p className="mt-4 flex gap-4 text-sm text-[var(--color-ink-muted)]">
            {player.skill_tier && <span className="capitalize">{player.skill_tier} tier</span>}
            {player.dupr_id && (
              <span className="font-[family-name:var(--font-mono)]">DUPR {player.dupr_id}</span>
            )}
          </p>
        )}

        <section className="mt-10">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
            Match history
          </h2>
          <div className="mt-4">
            <MatchHistoryList
              items={(matches ?? []).map((m) => {
                const onTeamA = m.team_a.includes(id);
                const opponentIds = onTeamA ? m.team_b : m.team_a;
                const opponentLabel =
                  opponentIds.map((pid: string) => nameById.get(pid) ?? "Unknown").join(" & ") ||
                  "Unknown";
                const session = sessionById.get(m.session_id);
                const setsLabel = (m.sets as MatchSet[])
                  .map((s) => (onTeamA ? `${s.a}-${s.b}` : `${s.b}-${s.a}`))
                  .join(", ");
                const won =
                  (onTeamA && m.winning_team === "a") || (!onTeamA && m.winning_team === "b");

                return {
                  id: m.id,
                  opponentLabel,
                  setsLabel,
                  sessionId: session?.id ?? null,
                  sessionLabel: session ? formatSessionDate(session.date_time) : null,
                  sessionDateTime: session?.date_time ?? null,
                  outcome: won ? "win" : "loss",
                };
              })}
              emptyMessage="No matches recorded yet."
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6">
      <p className="text-xs uppercase tracking-widest text-[var(--color-ink-muted)]">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-mono)] text-4xl font-semibold text-[var(--color-ink)]">
        {value}
      </p>
    </div>
  );
}
