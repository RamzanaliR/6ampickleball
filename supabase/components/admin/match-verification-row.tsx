"use client";

import { useState, useTransition } from "react";
import { rejectMatch, verifyMatch } from "@/lib/actions/matches";

export function MatchVerificationRow({
  matchId,
  sessionTitle,
  sessionDate,
  teamALabel,
  teamBLabel,
  setsLabel,
  winningTeam,
  submittedByName,
}: {
  matchId: string;
  sessionTitle: string;
  sessionDate: string;
  teamALabel: string;
  teamBLabel: string;
  setsLabel: string;
  winningTeam: "a" | "b";
  submittedByName: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);

  function handle(action: "verify" | "reject") {
    setError(null);
    startTransition(async () => {
      try {
        if (action === "verify") {
          await verifyMatch(matchId);
        } else {
          await rejectMatch(matchId);
        }
        setResolved(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  if (resolved) return null;

  return (
    <div className="kitchen-line flex flex-col gap-3 py-4 last:border-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[var(--color-court)]">
            {sessionTitle} · {sessionDate}
          </p>
          <p className="mt-1 text-[var(--color-ink)]">
            <span className={winningTeam === "a" ? "font-semibold" : ""}>{teamALabel}</span>
            <span className="mx-2 text-[var(--color-ink-muted)]">vs</span>
            <span className={winningTeam === "b" ? "font-semibold" : ""}>{teamBLabel}</span>
          </p>
          <p className="mt-1 font-[family-name:var(--font-mono)] text-sm text-[var(--color-ink-muted)]">
            {setsLabel} · submitted by {submittedByName}
          </p>
          {error && <p className="mt-1 text-xs text-[var(--color-danger)]">{error}</p>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handle("verify")}
            disabled={isPending}
            className="rounded-[var(--radius-pill)] bg-[var(--color-court)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)] disabled:opacity-60"
          >
            Verify
          </button>
          <button
            onClick={() => handle("reject")}
            disabled={isPending}
            className="rounded-[var(--radius-pill)] border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-danger)] hover:text-[var(--color-danger)] disabled:opacity-60"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
