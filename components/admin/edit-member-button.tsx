"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { FormField } from "@/components/form-field";
import { updateMemberDetails } from "@/lib/actions/admin-players";
import { ResetPasswordButton } from "@/components/admin/reset-password-button";

export function EditMemberButton({
  playerId,
  name,
  nickname,
  phone,
  duprId,
  isAdmin = false,
}: {
  playerId: string;
  name: string;
  nickname: string | null;
  phone: string | null;
  duprId: string | null;
  isAdmin?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateMemberDetails(playerId, {}, formData);
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
        Edit
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Edit member">
        <form action={handleSubmit} className="space-y-4">
          <FormField label="Full name" name="name" defaultValue={name} required />
          <FormField label="Nickname" name="nickname" defaultValue={nickname ?? ""} placeholder="What should we call them?" />
          <FormField label="Phone" name="phone" type="tel" defaultValue={phone ?? ""} placeholder="+255 …" />
          <FormField label="DUPR ID" name="dupr_id" defaultValue={duprId ?? ""} placeholder="If they have one" />

          {error && (
            <p className="rounded-[var(--radius-input)] bg-[var(--color-danger-bg)] px-3 py-2 text-sm text-[var(--color-danger)]">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-[var(--radius-pill)] bg-[var(--color-court)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)] disabled:opacity-60"
              >
                {isPending ? "Saving…" : "Save"}
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
            {isAdmin && <ResetPasswordButton playerId={playerId} playerName={name} />}
          </div>
        </form>
      </Modal>
    </>
  );
}
