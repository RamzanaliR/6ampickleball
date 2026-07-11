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
          <col className="w-6" />
          <col />
          <col className="w-8" />
          <col className="w-8" />
          <col className="w-9" />
          <col className="w-9" />
          <col className="w-9" />
          {scoring === "points" && <col className="w-9" />}
        </colgroup>
        <thead>
          <tr className="kitchen-line font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-widest text-[var(--color-ink-muted)]">
            <th className="px-1.5 py-2">#</th>
            <th className="px-1.5 py-2">Player</th>
            <th className="px-1 py-2 text-right">W</th>
            <th className="px-1 py-2 text-right">L</th>
            <th className="px-1 py-2 text-right">PF</th>
            <th className="px-1 py-2 text-right">PA</th>
            <th className="px-1 py-2 text-right">PD</th>
            {scoring === "points" && <th className="px-1 py-2 text-right">Pts</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const pd = row.pf - row.pa;
            return (
              <tr key={row.playerId} className="border-b border-[var(--color-line)] last:border-0">
                <td className="px-1.5 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink-muted)]">
                  {i + 1}
                </td>
                <td className="truncate px-1.5 py-2 text-xs font-medium text-[var(--color-ink)]">
                  {nameById.get(row.playerId) ?? "Unknown"}
                </td>
                <td className="px-1 py-2 text-right font-[family-name:var(--font-mono)] text-xs">
                  {row.wins}
                </td>
                <td className="px-1 py-2 text-right font-[family-name:var(--font-mono)] text-xs">
                  {row.losses}
                </td>
                <td className="px-1 py-2 text-right font-[family-name:var(--font-mono)] text-xs">
                  {row.pf}
                </td>
                <td className="px-1 py-2 text-right font-[family-name:var(--font-mono)] text-xs">
                  {row.pa}
                </td>
                <td
                  className={`px-1 py-2 text-right font-[family-name:var(--font-mono)] text-xs ${
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
                  <td className="px-1 py-2 text-right font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--color-court)]">
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
