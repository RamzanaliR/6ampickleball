"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { FormField } from "@/components/form-field";
import type { PaymentFormState } from "@/lib/actions/payments";

const initialState: PaymentFormState = {};

export function PaymentForm({
  action,
  players,
  sessions,
}: {
  action: (prevState: PaymentFormState, formData: FormData) => Promise<PaymentFormState>;
  players: { id: string; name: string }[];
  sessions: { id: string; title: string }[];
}) {
  const [state, formAction] = useActionState(action, initialState);
  const [type, setType] = useState<"session_fee" | "membership">("session_fee");

  return (
    <form action={formAction} className="space-y-4">
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
            </option>
          ))}
        </select>
      </label>

      <div>
        <span className="text-sm font-medium text-[var(--color-ink)]">Charge type</span>
        <div className="mt-1.5 flex gap-2">
          <TypeButton active={type === "session_fee"} onClick={() => setType("session_fee")}>
            Session fee
          </TypeButton>
          <TypeButton active={type === "membership"} onClick={() => setType("membership")}>
            Membership
          </TypeButton>
        </div>
        <input type="hidden" name="type" value={type} />
      </div>

      {type === "session_fee" ? (
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
        <FormField label="Period" name="period" placeholder="2026-07" required />
      )}

      <FormField label="Amount (TZS)" name="amount" type="number" min={1} required />

      {state.error && (
        <p className="rounded-[var(--radius-input)] bg-[var(--color-danger-bg)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}

function TypeButton({
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
      {pending ? "Saving…" : "Add charge"}
    </button>
  );
}
