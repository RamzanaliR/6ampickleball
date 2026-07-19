"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { FormField } from "@/components/form-field";
import { CurrencyAmountInput } from "@/components/currency-amount-input";
import { TypeaheadSelect } from "@/components/typeahead-select";
import { createPayment, type PaymentFormState } from "@/lib/actions/payments";

const initialState: PaymentFormState = {};

type SelectedPlayer = { id: string; name: string; amount: string };

export function AddPaymentForm({
  players,
  sessions,
  duesByPlayerId,
  onSaved,
}: {
  players: { id: string; name: string; is_guest: boolean }[];
  sessions: { id: string; title: string }[];
  duesByPlayerId: Map<string, number | null>;
  onSaved?: () => void;
}) {
  const [state, formAction] = useActionState(createPayment, initialState);
  const [direction, setDirection] = useState<"received" | "paid">("received");
  const [chargeType, setChargeType] = useState<"session_fee" | "membership">("session_fee");
  const [selected, setSelected] = useState<SelectedPlayer[]>([]);
  const [addKey, setAddKey] = useState(0);

  useEffect(() => {
    if (state.success) onSaved?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  const availablePlayers = players.filter((p) => !selected.some((s) => s.id === p.id));

  function addPlayer(id: string) {
    const player = players.find((p) => p.id === id);
    if (!player) return;
    const preset = duesByPlayerId.get(id);
    setSelected((prev) => [
      ...prev,
      { id: player.id, name: player.name, amount: preset ? String(preset) : "" },
    ]);
    setAddKey((k) => k + 1); // remounts the typeahead so it clears
  }

  function removePlayer(id: string) {
    setSelected((prev) => prev.filter((s) => s.id !== id));
  }

  function updateAmount(id: string, digitsOnly: string) {
    setSelected((prev) => prev.map((s) => (s.id === id ? { ...s, amount: digitsOnly } : s)));
  }

  const entriesJson = JSON.stringify(
    selected.filter((s) => Number(s.amount) > 0).map((s) => ({ player_id: s.id, amount: Number(s.amount) }))
  );

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
          <div>
            <span className="text-sm font-medium text-[var(--color-ink)]">Add people</span>
            <div className="mt-1.5">
              <TypeaheadSelect
                key={addKey}
                options={availablePlayers.map((p) => ({
                  id: p.id,
                  label: p.is_guest ? `${p.name} (Guest)` : p.name,
                }))}
                placeholder={availablePlayers.length === 0 ? "Everyone added" : "Type a name to add…"}
                emptyMessage="No matching players"
                onSelect={addPlayer}
              />
            </div>
          </div>

          {selected.length > 0 && (
            <div className="overflow-hidden rounded-[var(--radius-input)] border border-[var(--color-line)]">
              {selected.map((s, i) => (
                <div
                  key={s.id}
                  className={`flex items-center gap-3 px-3 py-2.5 ${
                    i !== selected.length - 1 ? "border-b border-[var(--color-line)]" : ""
                  }`}
                >
                  <p className="min-w-0 flex-1 truncate text-sm text-[var(--color-ink)]">{s.name}</p>
                  <div className="w-32 shrink-0">
                    <AmountMiniInput value={s.amount} onChange={(v) => updateAmount(s.id, v)} />
                  </div>
                  <button
                    type="button"
                    onClick={() => removePlayer(s.id)}
                    aria-label={`Remove ${s.name}`}
                    className="shrink-0 text-[var(--color-ink-muted)] hover:text-[var(--color-danger)]"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <input type="hidden" name="entries" value={entriesJson} />

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

function AmountMiniInput({ value, onChange }: { value: string; onChange: (digits: string) => void }) {
  const display = value ? Number(value).toLocaleString("en-US") : "";
  return (
    <input
      type="text"
      inputMode="numeric"
      value={display}
      placeholder="0"
      onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
      className="w-full rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper)] px-2.5 py-1.5 text-right font-[family-name:var(--font-mono)] text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-court)]"
    />
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
