"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { setAdminRole } from "@/lib/actions/admin-players";

export function ToggleAdminButton({
  playerId,
  playerName,
  isAdmin,
}: {
  playerId: string;
  playerName: string;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await setAdminRole(playerId, !isAdmin);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-court)]"
      >
        {isAdmin ? "Remove admin" : "Make admin"}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={isAdmin ? "Remove admin" : "Make admin"}>
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-ink)]">
            {isAdmin ? (
              <>
                Remove admin access from <span className="font-medium">{playerName}</span>? They&apos;ll
                go back to a regular player account — nothing else about their profile changes.
              </>
            ) : (
              <>
                Give <span className="font-medium">{playerName}</span> admin access? They&apos;ll be able to
                manage players, sessions, tournaments, finances, and The Club, same as you.
              </>
            )}
          </p>
          {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPending}
              className={
                isAdmin
                  ? "rounded-[var(--radius-pill)] bg-[var(--color-danger)] px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-60"
                  : "rounded-[var(--radius-pill)] bg-[var(--color-court)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)] disabled:opacity-60"
              }
            >
              {isPending ? "Saving…" : isAdmin ? "Remove admin" : "Make admin"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="rounded-[var(--radius-pill)] border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink)]"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
