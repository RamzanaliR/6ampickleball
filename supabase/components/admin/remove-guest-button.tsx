"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { removeGuest } from "@/lib/actions/admin-players";

export function RemoveGuestButton({ playerId, playerName }: { playerId: string; playerName: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const router = useRouter();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await removeGuest(playerId);
      if (result.error) {
        setError(result.error);
      } else {
        setDone(true);
        router.refresh();
      }
    });
  }

  function handleClose() {
    setOpen(false);
    setDone(false);
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
      <Modal open={open} onClose={handleClose} title="Remove guest">
        {done ? (
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-ink)]">
              {playerName} is off the guest list. Their match history and other records are
              untouched.
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
              Remove <span className="font-medium">{playerName}</span> from the guest list? This
              only takes them off the active list — their match history and other records stay
              exactly as they are.
            </p>
            {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className="rounded-[var(--radius-pill)] bg-[var(--color-danger)] px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-60"
              >
                {isPending ? "Removing…" : "Remove guest"}
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
