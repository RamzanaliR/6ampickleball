import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: players } = await supabase
    .from("players")
    .select("name, points, wins, losses, skill_tier")
    .eq("status", "approved")
    .order("points", { ascending: false });

  return (
    <div>
      <PageHeader
        eyebrow="Standings"
        title="Leaderboard"
        subtitle="Points update once match results are verified — that logic lands in Phase 4."
      />
      <div className="mx-auto mt-8 max-w-6xl px-6 pb-16">
        {!players || players.length === 0 ? (
          <EmptyState message="No approved players yet." />
        ) : (
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)]">
            <table className="w-full text-left">
              <thead>
                <tr className="kitchen-line font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[var(--color-ink-muted)]">
                  <th className="px-6 py-3">#</th>
                  <th className="px-6 py-3">Player</th>
                  <th className="px-6 py-3">Tier</th>
                  <th className="px-6 py-3 text-right">W</th>
                  <th className="px-6 py-3 text-right">L</th>
                  <th className="px-6 py-3 text-right">Points</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p, i) => (
                  <tr key={p.name + i} className="border-b border-[var(--color-line)] last:border-0">
                    <td className="px-6 py-3 font-[family-name:var(--font-mono)] text-[var(--color-ink-muted)]">
                      {i + 1}
                    </td>
                    <td className="px-6 py-3 font-medium text-[var(--color-ink)]">{p.name}</td>
                    <td className="px-6 py-3 capitalize text-[var(--color-ink-muted)]">
                      {p.skill_tier ?? "—"}
                    </td>
                    <td className="px-6 py-3 text-right font-[family-name:var(--font-mono)]">{p.wins}</td>
                    <td className="px-6 py-3 text-right font-[family-name:var(--font-mono)]">{p.losses}</td>
                    <td className="px-6 py-3 text-right font-[family-name:var(--font-mono)] font-semibold text-[var(--color-court)]">
                      {p.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
