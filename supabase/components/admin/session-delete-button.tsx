"use client";

import { useState, useTransition } from "react";
import { deleteSession } from "@/lib/actions/admin-sessions";

export function SessionDeleteButton({ sessionId }: { sessionId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      try {
        await deleteSession(sessionId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
        setConfirming(false);
      }
    });
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--color-danger)]">Delete for good?</span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="text-sm font-semibold text-[var(--color-danger)] disabled:opacity-60"
        >
          {isPending ? "…" : "Yes, delete"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={isPending}
          className="text-sm font-medium text-[var(--color-ink-muted)]"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-[var(--color-danger)]">{error}</span>}
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-sm font-medium text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-danger)]"
      >
        Delete
      </button>
    </div>
  );
}
