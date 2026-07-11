"use client";

import { useState } from "react";
import { Modal } from "@/components/modal";
import { ProfileForm } from "@/components/profile-form";
import { ChangePasswordForm } from "@/components/change-password-form";

export function ProfileOverview({
  name,
  nickname,
  phone,
  duprId,
}: {
  name: string;
  nickname: string | null;
  phone: string | null;
  duprId: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="space-y-3">
        <Row label="Name" value={name} />
        <Row label="Nickname" value={nickname ?? "Not set"} />
        <Row label="Phone" value={phone ?? "Not set"} />
        <Row label="DUPR ID" value={duprId ?? "Not set"} />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-2 rounded-[var(--radius-pill)] border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-court)] hover:text-[var(--color-court)]"
        >
          Edit profile
        </button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Edit profile">
        <div className="space-y-8">
          <ProfileForm name={name} nickname={nickname} phone={phone} duprId={duprId} />
          <div className="kitchen-line pt-6">
            <h3 className="mb-4 font-[family-name:var(--font-display)] text-lg font-bold uppercase tracking-tight text-[var(--color-ink)]">
              Password
            </h3>
            <ChangePasswordForm />
          </div>
        </div>
      </Modal>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[var(--color-ink-muted)]">{label}</span>
      <span className="text-sm font-medium capitalize text-[var(--color-ink)]">{value}</span>
    </div>
  );
}
