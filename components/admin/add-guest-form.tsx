"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { FormField } from "@/components/form-field";
import { addGuestToSession, type AddGuestState } from "@/lib/actions/guests";

const initialState: AddGuestState = {};

export function AddGuestForm({
  sessionId,
  knownGuests,
}: {
  sessionId: string;
  knownGuests: { id: string; name: string }[];
}) {
  const boundAction = addGuestToSession.bind(null, sessionId);
  const [state, formAction] = useActionState(boundAction, initialState);
  const [mode, setMode] = useState<"new" | "returning">("new");

  return (
    <form action={formAction} className="space-y-3">
      {knownGuests.length > 0 && (
        <div className="flex gap-2">
          <TabButton active={mode === "new"} onClick={() => setMode("new")}>
            New guest
          </TabButton>
          <TabButton active={mode === "returning"} onClick={() => setMode("returning")}>
            Returning guest
          </TabButton>
        </div>
      )}

      {mode === "new" || knownGuests.length === 0 ? (
        <FormField label="Guest name" name="name" placeholder="Full name" />
      ) : (
        <label className="block">
          <span className="text-sm font-medium text-[var(--color-ink)]">Guest</span>
          <select
            name="existing_guest_id"
            defaultValue=""
            className="mt-1.5 w-full rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3.5 py-2.5 text-[var(--color-ink)] outline-none focus:border-[var(--color-court)]"
          >
            <option value="" disabled>
              Select guest…
            </option>
            {knownGuests.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
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

function TabButton({
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
          ? "rounded-[var(--radius-pill)] bg-[var(--color-court)] px-3 py-1.5 text-xs font-semibold text-white"
          : "rounded-[var(--radius-pill)] border border-[var(--color-line)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink)]"
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
      className="rounded-[var(--radius-pill)] bg-[var(--color-court)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)] disabled:opacity-60"
    >
      {pending ? "Adding…" : "Add to session"}
    </button>
  );
}
