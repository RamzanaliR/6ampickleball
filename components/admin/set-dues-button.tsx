"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { CurrencyAmountInput } from "@/components/currency-amount-input";
import { setMemberDuesAmount } from "@/lib/actions/dues";
import { formatTZS } from "@/lib/format";

export function SetDuesButton({
  playerId,
  playerName,
  currentAmount,
}: {
  playerId: string;
  playerName: string;
  currentAmount: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(null);
    const raw = String(formData.get("amount") ?? "").trim();
    const amount = raw ? Number(raw) : null;
    startTransition(async () => {
      try {
        await setMemberDuesAmount(playerId, amount);
        setOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-ink-muted)] underline decoration-dotted underline-offset-4 transition-colors hover:text-[var(--color-court)]"
      >
        {currentAmount ? formatTZS(currentAmount) : "Set dues"}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Monthly dues">
        <form action={handleSubmit} className="space-y-4">
          <p className="text-sm text-[var(--color-ink-muted)]">
            Preset monthly dues amount for <span className="font-medium text-[var(--color-ink)]">{playerName}</span>.
            Leave blank if they pay per-session instead.
          </p>
          <CurrencyAmountInput name="amount" defaultValue={currentAmount ?? undefined} />
          {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
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
        </form>
      </Modal>
    </>
  );
}
