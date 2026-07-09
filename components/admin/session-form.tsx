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
      <FormField
        label="Capacity"
        name="capacity"
        type="number"
        min={1}
        defaultValue={defaultValues?.capacity}
        required
      />

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
