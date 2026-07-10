import type { StandingsRow } from "@/lib/fixtures/standings";
import type { FixtureScoring } from "@/lib/types";

export function SessionStandingsTable({
  rows,
  nameById,
  scoring,
}: {
  rows: StandingsRow[];
  nameById: Map<string, string>;
  scoring: FixtureScoring;
}) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)]">
      <table className="w-full min-w-[480px] text-left">
        <thead>
          <tr className="kitchen-line font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[var(--color-ink-muted)]">
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Player</th>
            <th className="px-4 py-3 text-right">W</th>
            <th className="px-4 py-3 text-right">L</th>
            <th className="px-4 py-3 text-right">PF</th>
            <th className="px-4 py-3 text-right">PA</th>
            <th className="px-4 py-3 text-right">PD</th>
            {scoring === "points" && <th className="px-4 py-3 text-right">Pts</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const pd = row.pf - row.pa;
            return (
              <tr key={row.playerId} className="border-b border-[var(--color-line)] last:border-0">
                <td className="px-4 py-3 font-[family-name:var(--font-mono)] text-[var(--color-ink-muted)]">
                  {i + 1}
                </td>
                <td className="px-4 py-3 font-medium text-[var(--color-ink)]">
                  {nameById.get(row.playerId) ?? "Unknown"}
                </td>
                <td className="px-4 py-3 text-right font-[family-name:var(--font-mono)]">
                  {row.wins}
                </td>
                <td className="px-4 py-3 text-right font-[family-name:var(--font-mono)]">
                  {row.losses}
                </td>
                <td className="px-4 py-3 text-right font-[family-name:var(--font-mono)]">
                  {row.pf}
                </td>
                <td className="px-4 py-3 text-right font-[family-name:var(--font-mono)]">
                  {row.pa}
                </td>
                <td
                  className={`px-4 py-3 text-right font-[family-name:var(--font-mono)] ${
                    pd > 0
                      ? "text-[var(--color-court)]"
                      : pd < 0
                        ? "text-[var(--color-danger)]"
                        : "text-[var(--color-ink-muted)]"
                  }`}
                >
                  {pd > 0 ? `+${pd}` : pd}
                </td>
                {scoring === "points" && (
                  <td className="px-4 py-3 text-right font-[family-name:var(--font-mono)] font-semibold text-[var(--color-court)]">
                    {row.points}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
