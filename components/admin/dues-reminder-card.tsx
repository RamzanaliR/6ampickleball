"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { chargeMonthlyDues, skipMonthlyDues } from "@/lib/actions/dues";
import { formatTZS } from "@/lib/format";

export function DuesReminderCard({
  period,
  monthLabel,
  eligibleCount,
  eligibleTotal,
  alreadySkipped = false,
}: {
  period: string;
  monthLabel: string;
  eligibleCount: number;
  eligibleTotal: number;
  alreadySkipped?: boolean;
}) {
  const [openCharge, setOpenCharge] = useState(false);
  const [openSkip, setOpenSkip] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleCharge() {
    setError(null);
    startTransition(async () => {
      const result = await chargeMonthlyDues(period);
      if (result.error) {
        setError(result.error);
      } else {
        setOpenCharge(false);
        router.refresh();
      }
    });
  }

  function handleSkip() {
    setError(null);
    startTransition(async () => {
      const result = await skipMonthlyDues(period);
      if (result.error) {
        setError(result.error);
      } else {
        setOpenSkip(false);
        router.refresh();
      }
    });
  }

  return (
    <div
      className={
        alreadySkipped
          ? "mb-6 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-5"
          : "mb-6 rounded-[var(--radius-card)] border border-[var(--color-ball)] bg-[var(--color-ball)]/15 p-5"
      }
    >
      <p className="font-medium text-[var(--color-ink)]">
        {alreadySkipped ? `Dues skipped for ${monthLabel}` : `Confirm dues for ${monthLabel}`}
      </p>
      <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
        {alreadySkipped
          ? "Members are paying per-session this month. Changed your mind? You can still charge dues below."
          : eligibleCount > 0
            ? `${eligibleCount} member${eligibleCount === 1 ? "" : "s"} have a preset dues amount — charging now creates ${formatTZS(eligibleTotal)} in unpaid dues.`
            : "No members have a preset dues amount yet — set one in Club Members below before charging."}
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setOpenCharge(true)}
          className="rounded-[var(--radius-pill)] bg-[var(--color-court)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)]"
        >
          Charge dues
        </button>
        {!alreadySkipped && (
          <button
            type="button"
            onClick={() => setOpenSkip(true)}
            className="rounded-[var(--radius-pill)] border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-court)] hover:text-[var(--color-court)]"
          >
            Skip this month
          </button>
        )}
      </div>

      <Modal open={openCharge} onClose={() => setOpenCharge(false)} title="Charge dues">
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-ink)]">
            Charge {monthLabel} dues to {eligibleCount} member{eligibleCount === 1 ? "" : "s"} for a
            total of {formatTZS(eligibleTotal)}? Each shows up as an unpaid charge on their
            account — you mark them paid as usual once they pay.
          </p>
          {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCharge}
              disabled={isPending || eligibleCount === 0}
              className="rounded-[var(--radius-pill)] bg-[var(--color-court)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)] disabled:opacity-60"
            >
              {isPending ? "Charging…" : "Charge dues"}
            </button>
            <button
              type="button"
              onClick={() => setOpenCharge(false)}
              disabled={isPending}
              className="rounded-[var(--radius-pill)] border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink)]"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={openSkip} onClose={() => setOpenSkip(false)} title="Skip this month">
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-ink)]">
            Skip dues for {monthLabel}? No membership charges will be created — members just pay
            per session as usual. You can still charge dues later this month if you change your
            mind.
          </p>
          {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSkip}
              disabled={isPending}
              className="rounded-[var(--radius-pill)] border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-court)] hover:text-[var(--color-court)] disabled:opacity-60"
            >
              {isPending ? "Saving…" : "Skip this month"}
            </button>
            <button
              type="button"
              onClick={() => setOpenSkip(false)}
              disabled={isPending}
              className="rounded-[var(--radius-pill)] border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink)]"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
