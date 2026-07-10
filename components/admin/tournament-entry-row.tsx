"use client";

import { useState, useTransition } from "react";
import { removeTournamentEntry } from "@/lib/actions/tournaments";

export function TournamentEntryRow({
  tournamentId,
  playerId,
  name,
}: {
  tournamentId: string;
  playerId: string;
  name: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleRemove() {
    setError(null);
    startTransition(async () => {
      try {
        await removeTournamentEntry(tournamentId, playerId);
        setRemoved(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  if (removed) return null;

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-[var(--color-ink)]">{name}</span>
      <div className="flex items-center gap-2">
        {error && <span className="text-xs text-[var(--color-danger)]">{error}</span>}
        <button
          onClick={handleRemove}
          disabled={isPending}
          className="text-xs font-medium text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-danger)] disabled:opacity-60"
        >
          {isPending ? "…" : "Remove"}
        </button>
      </div>
    </div>
  );
}
