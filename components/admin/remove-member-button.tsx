"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { removeMember } from "@/lib/actions/admin-players";

export function RemoveMemberButton({ playerId, playerName }: { playerId: string; playerName: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<"deleted" | "removed" | null>(null);
  const router = useRouter();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      try {
        const { mode } = await removeMember(playerId);
        setResult(mode);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  function handleClose() {
    setOpen(false);
    setResult(null);
    setError(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-danger)]"
      >
        Remove
      </button>
      <Modal open={open} onClose={handleClose} title="Remove member">
        {result ? (
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-ink)]">
              {result === "deleted"
                ? `${playerName}'s account has been fully deleted — they can no longer sign in.`
                : `${playerName} has been removed from the roster and leaderboard. Their account couldn't be fully deleted because they have activity on record (sessions, matches, payments, or posts), so history stays intact.`}
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-[var(--radius-pill)] border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-court)] hover:text-[var(--color-court)]"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-ink)]">
              Remove <span className="font-medium">{playerName}</span> from the club? If they have
              no activity on record this deletes their account entirely; otherwise they&apos;re
              taken off the roster and leaderboard but their history is kept.
            </p>
            {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className="rounded-[var(--radius-pill)] bg-[var(--color-danger)] px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-60"
              >
                {isPending ? "Removing…" : "Remove member"}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="rounded-[var(--radius-pill)] border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink)]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
