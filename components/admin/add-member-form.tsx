"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { FormField } from "@/components/form-field";
import { addMember, type AddMemberFormState } from "@/lib/actions/admin-players";

const initialState: AddMemberFormState = {};

export function AddMemberForm() {
  const [state, formAction] = useActionState(addMember, initialState);
  const [copied, setCopied] = useState(false);

  if (state.created) {
    const { name, email, password } = state.created;
    const shareText = `You're in! 6AM Pickleball Club login:\nEmail: ${email}\nPassword: ${password}\n\nSign in and change your password when you get a chance.`;

    async function handleCopy() {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
    }

    return (
      <div className="space-y-4">
        <p className="text-[var(--color-ink)]">
          <span className="font-medium">{name}</span> is in and approved. Share these details
          with them — this password only shows once, so copy it now.
        </p>
        <div className="space-y-1 rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper)] p-4 font-[family-name:var(--font-mono)] text-sm text-[var(--color-ink)]">
          <p>Email: {email}</p>
          <p>Password: {password}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleCopy}
            className="rounded-[var(--radius-pill)] bg-[var(--color-court)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)]"
          >
            {copied ? "Copied" : "Copy for WhatsApp"}
          </button>
          <button
            onClick={() => window.location.assign("/admin/players/new")}
            className="rounded-[var(--radius-pill)] border border-[var(--color-line)] px-5 py-2.5 text-sm font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-court)] hover:text-[var(--color-court)]"
          >
            Add another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <FormField label="Full name" name="name" required />
      <FormField label="Email" name="email" type="email" required />

      {state.error && (
        <p className="rounded-[var(--radius-input)] bg-[var(--color-danger-bg)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {state.error}
        </p>
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
      {pending ? "Adding…" : "Add member"}
    </button>
  );
}
