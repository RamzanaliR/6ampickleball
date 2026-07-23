"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { SessionQuickActions } from "@/components/admin/session-quick-actions";
import { SessionDeleteButton } from "@/components/admin/session-delete-button";
import { TestReminderButton } from "@/components/admin/test-reminder-button";
import { bulkDeleteSessions, bulkSetSessionStatus } from "@/lib/actions/admin-sessions";
import { formatSessionDate, formatSessionTime } from "@/lib/format";

export type AdminSessionRow = {
  id: string;
  title: string;
  dateTime: string;
  location: string;
  capacity: number;
  courts: number | null;
  status: "upcoming" | "completed" | "cancelled";
  countsTowardLeaderboard: boolean;
  duprEligible: boolean;
  confirmedCount: number;
  guestCount: number;
  noShowCount: number;
  hasFixtures: boolean;
};

export type AdminSessionGroup = { label: string; sessions: AdminSessionRow[] };

const statusPillClass: Record<string, string> = {
  upcoming: "bg-[var(--color-court)]/10 text-[var(--color-court)]",
  completed: "bg-[var(--color-ink-muted)]/10 text-[var(--color-ink-muted)]",
  cancelled: "bg-[var(--color-danger-bg)] text-[var(--color-danger)]",
};

function StatChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-[var(--radius-pill)] border border-[var(--color-line)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-ink-muted)]">
      {children}
    </span>
  );
}

export function SessionsBoard({
  groups,
  isAdmin,
}: {
  groups: AdminSessionGroup[];
  isAdmin: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [bulkError, setBulkError] = useState<string | null>(null);

  function toggle(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function runBulk(action: () => Promise<{ error?: string; count?: number }>) {
    setBulkError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setBulkError(result.error);
      } else {
        clearSelection();
      }
    });
  }

  return (
    <div className="space-y-8 pb-20">
      {groups.map((group) => (
        <details key={group.label} open className="group">
          <summary className="cursor-pointer list-none font-[family-name:var(--font-display)] text-lg font-bold uppercase tracking-tight text-[var(--color-ink)]">
            <span className="inline-flex items-center gap-2">
              <span className="text-[var(--color-court)] transition-transform group-open:rotate-90">
                ▸
              </span>
              {group.label}
              <span className="font-[family-name:var(--font-mono)] text-xs font-normal normal-case tracking-normal text-[var(--color-ink-muted)]">
                ({group.sessions.length})
              </span>
            </span>
          </summary>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.sessions.map((s) => (
              <div
                key={s.id}
                className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  {isAdmin ? (
                    <input
                      type="checkbox"
                      checked={selected.has(s.id)}
                      onChange={(e) => toggle(s.id, e.target.checked)}
                      className="mt-1 h-4 w-4 accent-[var(--color-court)]"
                      aria-label={`Select ${s.title}`}
                    />
                  ) : (
                    <span />
                  )}
                  <span
                    className={`rounded-[var(--radius-pill)] px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest ${statusPillClass[s.status]}`}
                  >
                    {s.status}
                  </span>
                </div>

                <Link href={`/sessions/${s.id}`} className="block">
                  <p className="mt-1.5 font-medium leading-snug text-[var(--color-ink)] hover:text-[var(--color-court)]">
                    {s.title}
                  </p>
                </Link>
                <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
                  {formatSessionDate(s.dateTime)} · {formatSessionTime(s.dateTime)}
                </p>
                <p className="text-xs text-[var(--color-ink-muted)]">
                  {s.location} · cap {s.capacity}
                  {s.courts ? ` · ${s.courts} courts` : ""}
                </p>

                {(!s.countsTowardLeaderboard || s.duprEligible) && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {!s.countsTowardLeaderboard && <StatChip>Not on leaderboard</StatChip>}
                    {s.duprEligible && <StatChip>DUPR</StatChip>}
                  </div>
                )}

                <div className="mt-2 flex flex-wrap gap-1.5">
                  <StatChip>{s.confirmedCount} confirmed</StatChip>
                  {s.guestCount > 0 && <StatChip>{s.guestCount} guests</StatChip>}
                  {s.noShowCount > 0 && <StatChip>{s.noShowCount} no-show</StatChip>}
                  <StatChip>{s.hasFixtures ? "Fixtures generated" : "No fixtures yet"}</StatChip>
                </div>

                <div className="kitchen-line mt-3 flex flex-wrap items-center justify-between gap-2 pt-3">
                  <Link
                    href={`/admin/sessions/${s.id}/edit`}
                    className="text-xs font-medium text-[var(--color-ink)] hover:text-[var(--color-court)]"
                  >
                    Edit
                  </Link>
                  {isAdmin && (
                    <div className="flex items-center gap-3">
                      <TestReminderButton sessionId={s.id} />
                      <SessionQuickActions sessionId={s.id} status={s.status} />
                      <SessionDeleteButton sessionId={s.id} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </details>
      ))}

      {isAdmin && selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--color-line)] bg-[var(--color-paper-raised)] px-6 py-4 shadow-lg">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-[var(--color-ink)]">
              {selected.size} selected
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {bulkError && <span className="text-xs text-[var(--color-danger)]">{bulkError}</span>}
              <button
                type="button"
                disabled={isPending}
                onClick={() => runBulk(() => bulkSetSessionStatus([...selected], "completed"))}
                className="rounded-[var(--radius-pill)] border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] hover:border-[var(--color-court)] hover:text-[var(--color-court)] disabled:opacity-60"
              >
                Mark completed
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => runBulk(() => bulkSetSessionStatus([...selected], "cancelled"))}
                className="rounded-[var(--radius-pill)] border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] hover:border-[var(--color-danger)] hover:text-[var(--color-danger)] disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  if (window.confirm(`Delete ${selected.size} session(s) for good? This can't be undone.`)) {
                    runBulk(() => bulkDeleteSessions([...selected]));
                  }
                }}
                className="rounded-[var(--radius-pill)] bg-[var(--color-danger)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isPending ? "Working…" : "Delete"}
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="text-sm font-medium text-[var(--color-ink-muted)]"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
