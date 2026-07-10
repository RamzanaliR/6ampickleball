"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { FormField } from "@/components/form-field";
import { updatePassword, type PasswordFormState } from "@/lib/actions/profile";

const initialState: PasswordFormState = {};

export function ChangePasswordForm() {
  const [state, formAction] = useActionState(updatePassword, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <FormField
        label="New password"
        name="password"
        type="password"
        minLength={6}
        required
        autoComplete="new-password"
      />
      <FormField
        label="Confirm new password"
        name="confirm_password"
        type="password"
        minLength={6}
        required
        autoComplete="new-password"
      />

      {state.error && (
        <p className="rounded-[var(--radius-input)] bg-[var(--color-danger-bg)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-sm font-medium text-[var(--color-court)]">Password updated.</p>
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
      {pending ? "Saving…" : "Update password"}
    </button>
  );
}
