"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";

export interface MatchHistoryItem {
  id: string;
  opponentLabel: string;
  setsLabel: string;
  sessionId: string | null;
  sessionLabel: string | null;
  sessionDateTime: string | null;
  outcome: "win" | "loss" | "pending";
}

export function MatchHistoryList({
  items,
  emptyMessage,
}: {
  items: MatchHistoryItem[];
  emptyMessage: string;
}) {
  const [selectedSession, setSelectedSession] = useState<string>("all");

  const sessionOptions = useMemo(() => {
    const seen = new Map<string, { label: string; dateTime: string }>();
    for (const item of items) {
      if (item.sessionId && item.sessionLabel && !seen.has(item.sessionId)) {
        seen.set(item.sessionId, {
          label: item.sessionLabel,
          dateTime: item.sessionDateTime ?? "",
        });
      }
    }
    return [...seen.entries()].sort((a, b) => b[1].dateTime.localeCompare(a[1].dateTime));
  }, [items]);

  const filtered =
    selectedSession === "all" ? items : items.filter((i) => i.sessionId === selectedSession);

  return (
    <div>
      {sessionOptions.length > 0 && (
        <div className="mb-4 flex justify-end">
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] px-3.5 py-2 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-court)]"
          >
            <option value="all">All sessions</option>
            {sessionOptions.map(([id, { label }]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)]">
          {filtered.map((item, i) => (
            <div
              key={item.id}
              className={`flex items-center justify-between px-5 py-4 ${
                i !== filtered.length - 1 ? "kitchen-line" : ""
              }`}
            >
              <div>
                <p className="font-medium text-[var(--color-ink)]">vs {item.opponentLabel}</p>
                <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-ink-muted)]">
                  {item.setsLabel}
                  {item.sessionLabel ? ` · ${item.sessionLabel}` : ""}
                </p>
              </div>
              {item.outcome === "pending" ? (
                <span className="shrink-0 rounded-[var(--radius-pill)] border border-[var(--color-ball)] bg-[var(--color-ball)]/30 px-3 py-1 text-xs font-semibold text-[var(--color-ink)]">
                  Pending
                </span>
              ) : (
                <span
                  className={
                    item.outcome === "win"
                      ? "shrink-0 rounded-[var(--radius-pill)] bg-[var(--color-court)] px-3 py-1 text-xs font-semibold text-white"
                      : "shrink-0 rounded-[var(--radius-pill)] border border-[var(--color-line)] px-3 py-1 text-xs font-semibold text-[var(--color-ink-muted)]"
                  }
                >
                  {item.outcome === "win" ? "Win" : "Loss"}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
