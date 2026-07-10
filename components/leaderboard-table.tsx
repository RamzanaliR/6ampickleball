"use client";

import { useState } from "react";

type LeaderboardPlayer = {
  name: string;
  points: number;
  wins: number;
  losses: number;
  skill_tier: "beginner" | "intermediate" | "advanced" | null;
};

const TIERS = ["beginner", "intermediate", "advanced"] as const;

export function LeaderboardTable({ players }: { players: LeaderboardPlayer[] }) {
  const [tier, setTier] = useState<string>("all");

  const filtered = tier === "all" ? players : players.filter((p) => p.skill_tier === tier);

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <select
          value={tier}
          onChange={(e) => setTier(e.target.value)}
          className="rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] px-3.5 py-2 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-court)]"
        >
          <option value="all">All tiers</option>
          {TIERS.map((t) => (
            <option key={t} value={t} className="capitalize">
              {t[0].toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
      </div>

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
            {filtered.map((p, i) => (
              <tr key={p.name + i} className="border-b border-[var(--color-line)] last:border-0">
                <td className="px-6 py-3 font-[family-name:var(--font-mono)] text-[var(--color-ink-muted)]">
                  {i + 1}
                </td>
                <td className="px-6 py-3 font-medium text-[var(--color-ink)]">{p.name}</td>
                <td className="px-6 py-3 capitalize text-[var(--color-ink-muted)]">
                  {p.skill_tier ?? "—"}
                </td>
                <td className="px-6 py-3 text-right font-[family-name:var(--font-mono)]">
                  {p.wins}
                </td>
                <td className="px-6 py-3 text-right font-[family-name:var(--font-mono)]">
                  {p.losses}
                </td>
                <td className="px-6 py-3 text-right font-[family-name:var(--font-mono)] font-semibold text-[var(--color-court)]">
                  {p.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="px-6 py-10 text-center text-[var(--color-ink-muted)]">
            No players in this tier yet.
          </p>
        )}
      </div>
    </div>
  );
}
