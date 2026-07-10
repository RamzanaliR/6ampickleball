"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createFeedPostPlayer, type FeedFormState } from "@/lib/actions/feed";

const initialState: FeedFormState = {};

export function FeedComposeForm() {
  const [state, formAction] = useActionState(createFeedPostPlayer, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <textarea
        name="content"
        required
        rows={3}
        placeholder="Share something with the club — a birthday shoutout, tournament photo, get-together..."
        className="w-full rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3.5 py-2.5 text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-court)]"
      />
      <input
        name="image_url"
        type="url"
        placeholder="Image URL (optional)"
        className="w-full rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-court)]"
      />

      {state.error && (
        <p className="rounded-[var(--radius-input)] bg-[var(--color-danger-bg)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-sm font-medium text-[var(--color-court)]">
          Submitted — an admin will review it shortly.
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
      {pending ? "Posting…" : "Post to feed"}
    </button>
  );
}
