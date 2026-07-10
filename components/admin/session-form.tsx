"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { FormField } from "@/components/form-field";
import type { SessionFormState } from "@/lib/actions/admin-sessions";

const initialState: SessionFormState = {};

export function SessionForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (prevState: SessionFormState, formData: FormData) => Promise<SessionFormState>;
  defaultValues?: {
    title: string;
    date: string;
    time: string;
    location: string;
    capacity: number;
    courts: number | null;
    countsTowardLeaderboard: boolean;
    duprEligible: boolean;
  };
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <FormField
        label="Title"
        name="title"
        defaultValue={defaultValues?.title}
        placeholder="Saturday Open Play"
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Date"
          name="date"
          type="date"
          defaultValue={defaultValues?.date}
          required
        />
        <FormField
          label="Time"
          name="time"
          type="time"
          defaultValue={defaultValues?.time}
          required
        />
      </div>
      <FormField
        label="Location"
        name="location"
        defaultValue={defaultValues?.location}
        placeholder="Oyster Bay Courts"
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Capacity"
          name="capacity"
          type="number"
          min={1}
          defaultValue={defaultValues?.capacity}
          required
        />
        <FormField
          label="Courts booked"
          name="courts"
          type="number"
          min={1}
          defaultValue={defaultValues?.courts ?? undefined}
          placeholder="e.g. 4"
        />
      </div>

      <div className="space-y-2 rounded-[var(--radius-input)] border border-[var(--color-line)] p-4">
        <label className="flex items-start gap-2.5">
          <input
            type="checkbox"
            name="counts_toward_leaderboard"
            defaultChecked={defaultValues?.countsTowardLeaderboard ?? true}
            className="mt-0.5 h-4 w-4 accent-[var(--color-court)]"
          />
          <span className="text-sm text-[var(--color-ink)]">
            Add to leaderboard
            <span className="block text-xs text-[var(--color-ink-muted)]">
              Uncheck for a session that shouldn&apos;t count toward the season leaderboard
              (e.g. a tournament). Players will see this on the session.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-2.5">
          <input
            type="checkbox"
            name="dupr_eligible"
            defaultChecked={defaultValues?.duprEligible ?? false}
            className="mt-0.5 h-4 w-4 accent-[var(--color-court)]"
          />
          <span className="text-sm text-[var(--color-ink)]">
            DUPR session
            <span className="block text-xs text-[var(--color-ink-muted)]">
              Flags this session as one whose results should be reported to DUPR
              manually — no automatic submission yet.
            </span>
          </span>
        </label>
      </div>

      {state.error && (
        <p className="rounded-[var(--radius-input)] bg-[var(--color-danger-bg)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {state.error}
        </p>
      )}

      <SubmitButton label={submitLabel} />
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-[var(--radius-pill)] bg-[var(--color-court)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)] disabled:opacity-60"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}
