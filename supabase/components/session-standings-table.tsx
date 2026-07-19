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
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)]">
      <table className="w-full table-fixed text-left">
        <colgroup>
          <col className="w-8" />
          <col className="w-24" />
          <col />
          <col />
          <col />
          <col />
          <col />
          {scoring === "points" && <col />}
        </colgroup>
        <thead>
          <tr className="kitchen-line font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-[var(--color-ink-muted)]">
            <th className="px-3 py-2.5">#</th>
            <th className="px-3 py-2.5">Player</th>
            <th className="px-2 py-2.5 text-right">W</th>
            <th className="px-2 py-2.5 text-right">L</th>
            <th className="px-2 py-2.5 text-right">PF</th>
            <th className="px-2 py-2.5 text-right">PA</th>
            <th className="px-2 py-2.5 text-right">PD</th>
            {scoring === "points" && <th className="px-2 py-2.5 text-right">Pts</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const pd = row.pf - row.pa;
            return (
              <tr key={row.playerId} className="border-b border-[var(--color-line)] last:border-0">
                <td className="px-3 py-2.5 font-[family-name:var(--font-mono)] text-sm text-[var(--color-ink-muted)]">
                  {i + 1}
                </td>
                <td className="truncate px-3 py-2.5 text-sm font-medium text-[var(--color-ink)]">
                  {nameById.get(row.playerId) ?? "Unknown"}
                </td>
                <td className="px-2 py-2.5 text-right font-[family-name:var(--font-mono)] text-sm">
                  {row.wins}
                </td>
                <td className="px-2 py-2.5 text-right font-[family-name:var(--font-mono)] text-sm">
                  {row.losses}
                </td>
                <td className="px-2 py-2.5 text-right font-[family-name:var(--font-mono)] text-sm">
                  {row.pf}
                </td>
                <td className="px-2 py-2.5 text-right font-[family-name:var(--font-mono)] text-sm">
                  {row.pa}
                </td>
                <td
                  className={`px-2 py-2.5 text-right font-[family-name:var(--font-mono)] text-sm ${
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
                  <td className="px-2 py-2.5 text-right font-[family-name:var(--font-mono)] text-sm font-semibold text-[var(--color-court)]">
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
