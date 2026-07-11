"use client";

import { useState, useTransition } from "react";
import { approvePlayer, rejectPlayer } from "@/lib/actions/admin-players";

export function PlayerApprovalRow({
  player,
  onResolved,
}: {
  player: { id: string; name: string; email: string; phone: string | null; skill_tier: string | null };
  onResolved?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);

  function handle(action: "approve" | "reject") {
    setError(null);
    startTransition(async () => {
      try {
        if (action === "approve") {
          await approvePlayer(player.id);
        } else {
          await rejectPlayer(player.id);
        }
        setResolved(true);
        onResolved?.();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  if (resolved) return null;

  return (
    <div className="kitchen-line flex flex-col gap-3 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium text-[var(--color-ink)]">{player.name}</p>
        <p className="text-sm text-[var(--color-ink-muted)]">
          {player.email}
          {player.phone ? ` · ${player.phone}` : ""}
          {player.skill_tier ? ` · ${player.skill_tier}` : ""}
        </p>
        {error && <p className="mt-1 text-xs text-[var(--color-danger)]">{error}</p>}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => handle("approve")}
          disabled={isPending}
          className="rounded-[var(--radius-pill)] bg-[var(--color-court)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)] disabled:opacity-60"
        >
          Approve
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
  );
}
