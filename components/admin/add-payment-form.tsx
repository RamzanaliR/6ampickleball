"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { FormField } from "@/components/form-field";
import { CurrencyAmountInput } from "@/components/currency-amount-input";
import { createPayment, type PaymentFormState } from "@/lib/actions/payments";

const initialState: PaymentFormState = {};

export function AddPaymentForm({
  players,
  sessions,
  onSaved,
}: {
  players: { id: string; name: string; is_guest: boolean }[];
  sessions: { id: string; title: string }[];
  onSaved?: () => void;
}) {
  const [state, formAction] = useActionState(createPayment, initialState);
  const [direction, setDirection] = useState<"received" | "paid">("received");
  const [chargeType, setChargeType] = useState<"session_fee" | "membership">("session_fee");

  useEffect(() => {
    if (state.success) onSaved?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <span className="text-sm font-medium text-[var(--color-ink)]">Type</span>
        <div className="mt-1.5 flex gap-2">
          <DirectionButton active={direction === "received"} onClick={() => setDirection("received")}>
            Received
          </DirectionButton>
          <DirectionButton active={direction === "paid"} onClick={() => setDirection("paid")}>
            Paid
          </DirectionButton>
        </div>
        <input type="hidden" name="direction" value={direction} />
      </div>

      {direction === "received" ? (
        <>
          <label className="block">
            <span className="text-sm font-medium text-[var(--color-ink)]">Player</span>
            <select
              name="player_id"
              required
              defaultValue=""
              className="mt-1.5 w-full rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3.5 py-2.5 text-[var(--color-ink)] outline-none focus:border-[var(--color-court)]"
            >
              <option value="" disabled>
                Select player…
              </option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.is_guest ? " (Guest)" : ""}
                </option>
              ))}
            </select>
          </label>

          <div>
            <span className="text-sm font-medium text-[var(--color-ink)]">Charge type</span>
            <div className="mt-1.5 flex gap-2">
              <DirectionButton active={chargeType === "session_fee"} onClick={() => setChargeType("session_fee")}>
                Session
              </DirectionButton>
              <DirectionButton active={chargeType === "membership"} onClick={() => setChargeType("membership")}>
                Membership
              </DirectionButton>
            </div>
            <input type="hidden" name="type" value={chargeType} />
          </div>

          {chargeType === "session_fee" ? (
            <label className="block">
              <span className="text-sm font-medium text-[var(--color-ink)]">Session</span>
              <select
                name="session_id"
                required
                defaultValue=""
                className="mt-1.5 w-full rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3.5 py-2.5 text-[var(--color-ink)] outline-none focus:border-[var(--color-court)]"
              >
                <option value="" disabled>
                  Select session…
                </option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="block">
              <span className="text-sm font-medium text-[var(--color-ink)]">Month</span>
              <input
                type="month"
                name="period"
                required
                className="mt-1.5 w-full rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3.5 py-2.5 text-[var(--color-ink)] outline-none focus:border-[var(--color-court)]"
              />
            </label>
          )}

          <CurrencyAmountInput name="amount" required />
          <FormField label="Received by" name="received_by" placeholder="Who took the payment?" />
        </>
      ) : (
        <>
          <FormField label="Paid to" name="paid_to" placeholder="Who was this paid to?" required />
          <FormField label="Description" name="description" placeholder="What was this for?" />
          <CurrencyAmountInput name="amount" required />
          <FormField label="Paid by" name="paid_by" placeholder="Who made the payment?" />
        </>
      )}

      {state.error && (
        <p className="rounded-[var(--radius-input)] bg-[var(--color-danger-bg)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}

function DirectionButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-[var(--radius-pill)] bg-[var(--color-court)] px-4 py-1.5 text-sm font-semibold text-white"
          : "rounded-[var(--radius-pill)] border border-[var(--color-line)] px-4 py-1.5 text-sm font-medium text-[var(--color-ink)]"
      }
    >
      {children}
    </button>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-[var(--radius-pill)] bg-[var(--color-court)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)] disabled:opacity-60"
    >
      {pending ? "Saving…" : "Add"}
    </button>
  );
}
