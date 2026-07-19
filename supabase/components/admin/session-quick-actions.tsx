"use client";

import { useState, useTransition } from "react";
import { setSessionStatus } from "@/lib/actions/admin-sessions";

export function SessionQuickActions({
  sessionId,
  status,
}: {
  sessionId: string;
  status: "upcoming" | "completed" | "cancelled";
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handle(next: "upcoming" | "completed" | "cancelled") {
    setError(null);
    startTransition(async () => {
      try {
        await setSessionStatus(sessionId, next);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  if (status !== "upcoming") {
    return (
      <button
        onClick={() => handle("upcoming")}
        disabled={isPending}
        className="text-sm font-medium text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-court)] disabled:opacity-60"
      >
        Reopen
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => handle("completed")}
        disabled={isPending}
        className="text-sm font-medium text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-court)] disabled:opacity-60"
      >
        Mark completed
      </button>
      <button
        onClick={() => handle("cancelled")}
        disabled={isPending}
        className="text-sm font-medium text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-danger)] disabled:opacity-60"
      >
        Cancel
      </button>
      {error && <span className="text-xs text-[var(--color-danger)]">{error}</span>}
    </div>
  );
}
