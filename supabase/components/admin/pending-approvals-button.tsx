"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { PlayerApprovalRow } from "@/components/admin/player-approval-row";
import { EmptyState } from "@/components/empty-state";

type PendingPlayer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  skill_tier: string | null;
};

export function PendingApprovalsButton({ initialPending }: { initialPending: PendingPlayer[] }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(initialPending);
  const router = useRouter();

  function handleResolved(id: string) {
    setPending((prev) => prev.filter((p) => p.id !== id));
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-[var(--radius-pill)] border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-court)] hover:text-[var(--color-court)] disabled:opacity-50"
        disabled={pending.length === 0}
      >
        Pending ({pending.length})
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Pending approval">
        {pending.length === 0 ? (
          <EmptyState message="No one waiting on approval right now." />
        ) : (
          <div className="divide-y divide-[var(--color-line)]">
            {pending.map((p) => (
              <PlayerApprovalRow key={p.id} player={p} onResolved={() => handleResolved(p.id)} />
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}
