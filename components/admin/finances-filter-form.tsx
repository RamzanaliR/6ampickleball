"use client";

import { useRouter } from "next/navigation";

export function FinancesFilterForm({
  players,
  sessions,
  player,
  session,
  month,
}: {
  players: { id: string; name: string }[];
  sessions: { id: string; title: string }[];
  player: string;
  session: string;
  month: string;
}) {
  const router = useRouter();

  function navigate(overrides: Partial<{ player: string; session: string; month: string }>) {
    const next = { player, session, month, ...overrides };
    const qs = new URLSearchParams();
    if (next.player) qs.set("player", next.player);
    if (next.session) qs.set("session", next.session);
    if (next.month) qs.set("month", next.month);
    const query = qs.toString();
    router.push(query ? `/admin/payments?${query}` : "/admin/payments");
  }

  const hasFilters = Boolean(player || session);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={player}
        onChange={(e) => navigate({ player: e.target.value })}
        className="rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-court)]"
      >
        <option value="">All players</option>
        {players.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <select
        value={session}
        onChange={(e) => navigate({ session: e.target.value })}
        className="rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-court)]"
      >
        <option value="">All sessions</option>
        {sessions.map((s) => (
          <option key={s.id} value={s.id}>
            {s.title}
          </option>
        ))}
      </select>
      <input
        type="month"
        value={month}
        onChange={(e) => navigate({ month: e.target.value })}
        className="rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-court)]"
      />
      {hasFilters && (
        <button
          type="button"
          onClick={() => navigate({ player: "", session: "" })}
          className="text-sm font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-court)]"
        >
          Clear
        </button>
      )}
    </div>
  );
}
