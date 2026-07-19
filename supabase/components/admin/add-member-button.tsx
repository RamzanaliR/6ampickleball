"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { AddMemberForm } from "@/components/admin/add-member-form";

export function AddMemberButton() {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const router = useRouter();

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setFormKey((k) => k + 1);
          setOpen(true);
        }}
        className="rounded-[var(--radius-pill)] bg-[var(--color-court)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)]"
      >
        + Add member
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add a member">
        <AddMemberForm
          key={formKey}
          onCreated={() => router.refresh()}
          onAddAnother={() => setFormKey((k) => k + 1)}
        />
      </Modal>
    </>
  );
}
