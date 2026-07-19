"use client";

import Link from "next/link";

type LeaderboardPlayer = {
  id: string;
  name: string;
  points: number;
  wins: number;
  losses: number;
};

export function LeaderboardTable({ players }: { players: LeaderboardPlayer[] }) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)]">
      <table className="w-full text-left">
        <thead>
          <tr className="kitchen-line font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-[var(--color-ink-muted)] sm:text-xs">
            <th className="px-2 py-2.5 sm:px-4 sm:py-3">#</th>
            <th className="px-2 py-2.5 sm:px-4 sm:py-3">Player</th>
            <th className="px-2 py-2.5 text-right sm:px-4 sm:py-3">GP</th>
            <th className="px-2 py-2.5 text-right sm:px-4 sm:py-3">W</th>
            <th className="px-2 py-2.5 text-right sm:px-4 sm:py-3">Pts</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p, i) => (
            <tr key={p.id} className="border-b border-[var(--color-line)] last:border-0">
              <td className="px-2 py-2.5 font-[family-name:var(--font-mono)] text-sm text-[var(--color-ink-muted)] sm:px-4 sm:py-3">
                {i + 1}
              </td>
              <td className="px-2 py-2.5 text-sm font-medium sm:px-4 sm:py-3">
                <Link
                  href={`/players/${p.id}`}
                  className="text-[var(--color-ink)] transition-colors hover:text-[var(--color-court)]"
                >
                  {p.name}
                </Link>
              </td>
              <td className="px-2 py-2.5 text-right font-[family-name:var(--font-mono)] text-sm text-[var(--color-ink-muted)] sm:px-4 sm:py-3">
                {p.wins + p.losses}
              </td>
              <td className="px-2 py-2.5 text-right font-[family-name:var(--font-mono)] text-sm sm:px-4 sm:py-3">
                {p.wins}
              </td>
              <td className="px-2 py-2.5 text-right font-[family-name:var(--font-mono)] text-sm font-semibold text-[var(--color-court)] sm:px-4 sm:py-3">
                {p.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {players.length === 0 && (
        <p className="px-6 py-10 text-center text-[var(--color-ink-muted)]">
          No players yet.
        </p>
      )}
    </div>
  );
}
