"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { AddPaymentForm } from "@/components/admin/add-payment-form";

export function AddPaymentButton({
  players,
  sessions,
  duesByPlayerId,
}: {
  players: { id: string; name: string; is_guest: boolean }[];
  sessions: { id: string; title: string }[];
  duesByPlayerId: Map<string, number | null>;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-[var(--radius-pill)] bg-[var(--color-court)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)]"
      >
        + Add
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add entry">
        <AddPaymentForm
          players={players}
          sessions={sessions}
          duesByPlayerId={duesByPlayerId}
          onSaved={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </Modal>
    </>
  );
}
