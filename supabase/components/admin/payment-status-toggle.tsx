"use client";

import { useState, useTransition } from "react";
import { setPaymentStatus } from "@/lib/actions/payments";

export function PaymentStatusToggle({
  paymentId,
  status,
}: {
  paymentId: string;
  status: "paid" | "unpaid";
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handle() {
    setError(null);
    startTransition(async () => {
      const result = await setPaymentStatus(paymentId, status === "paid" ? "unpaid" : "paid");
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-[var(--color-danger)]">{error}</span>}
      <button
        onClick={handle}
        disabled={isPending}
        className={
          status === "paid"
            ? "rounded-[var(--radius-pill)] border border-[var(--color-line)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-danger)] hover:text-[var(--color-danger)] disabled:opacity-60"
            : "rounded-[var(--radius-pill)] bg-[var(--color-court)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)] disabled:opacity-60"
        }
      >
        {isPending ? "…" : status === "paid" ? "Mark unpaid" : "Mark paid"}
      </button>
    </div>
  );
}
