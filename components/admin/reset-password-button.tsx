"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/modal";
import { resetMemberPassword } from "@/lib/actions/admin-players";

export function ResetPasswordButton({ playerId, playerName }: { playerId: string; playerName: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const response = await resetMemberPassword(playerId);
      if (response.error) {
        setError(response.error);
      } else if (response.reset) {
        setResult({ email: response.reset.email, password: response.reset.password });
      }
    });
  }

  function handleClose() {
    setOpen(false);
    setResult(null);
    setError(null);
    setCopied(false);
  }

  async function handleCopy() {
    if (!result) return;
    const text = `Your 6AM Pickleball Club password has been reset:\nEmail: ${result.email}\nNew password: ${result.password}\n\nSign in and change it when you get a chance.`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-court)]"
      >
        Reset password
      </button>
      <Modal open={open} onClose={handleClose} title="Reset password">
        {result ? (
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-ink)]">
              <span className="font-medium">{playerName}</span>&apos;s password has been reset —
              this only shows once, so copy it now and share it with them.
            </p>
            <div className="space-y-1 rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper)] p-4 font-[family-name:var(--font-mono)] text-sm text-[var(--color-ink)]">
              <p>Email: {result.email}</p>
              <p>New password: {result.password}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-[var(--radius-pill)] bg-[var(--color-court)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)]"
              >
                {copied ? "Copied" : "Copy for WhatsApp"}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-[var(--radius-pill)] border border-[var(--color-line)] px-5 py-2.5 text-sm font-medium text-[var(--color-ink)]"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-ink)]">
              Reset <span className="font-medium">{playerName}</span>&apos;s password? This
              immediately replaces their current password with a new one — their old password
              stops working right away.
            </p>
            {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className="rounded-[var(--radius-pill)] bg-[var(--color-court)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)] disabled:opacity-60"
              >
                {isPending ? "Resetting…" : "Reset password"}
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
