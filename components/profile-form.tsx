"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { FormField } from "@/components/form-field";
import { updateProfile, type ProfileFormState } from "@/lib/actions/profile";

const initialState: ProfileFormState = {};

export function ProfileForm({
  name,
  phone,
  skillTier,
  duprId,
}: {
  name: string;
  phone: string | null;
  skillTier: string | null;
  duprId: string | null;
}) {
  const [state, formAction] = useActionState(updateProfile, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <FormField label="Full name" name="name" defaultValue={name} required />
      <FormField
        label="Phone"
        name="phone"
        type="tel"
        defaultValue={phone ?? ""}
        placeholder="+255 …"
      />
      <label className="block">
        <span className="text-sm font-medium text-[var(--color-ink)]">Skill tier</span>
        <select
          name="skill_tier"
          defaultValue={skillTier ?? ""}
          className="mt-1.5 w-full rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3.5 py-2.5 text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-court)]"
        >
          <option value="">Not set</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </label>
      <FormField
        label="DUPR ID"
        name="dupr_id"
        defaultValue={duprId ?? ""}
        placeholder="If you have one"
      />

      {state.error && (
        <p className="rounded-[var(--radius-input)] bg-[var(--color-danger-bg)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-sm font-medium text-[var(--color-court)]">Saved.</p>
      )}

      <SubmitButton />
    </form>
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
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}
