"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { FeedFormState } from "@/lib/actions/feed";

const initialState: FeedFormState = {};

export function FeedPostForm({
  action,
}: {
  action: (prevState: FeedFormState, formData: FormData) => Promise<FeedFormState>;
}) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-[var(--color-ink)]">Announcement</span>
        <textarea
          name="content"
          required
          rows={4}
          placeholder="What's happening with the club?"
          className="mt-1.5 w-full rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3.5 py-2.5 text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-court)]"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-[var(--color-ink)]">Image URL (optional)</span>
        <input
          name="image_url"
          type="url"
          placeholder="https://…"
          className="mt-1.5 w-full rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3.5 py-2.5 text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-court)]"
        />
      </label>

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
      {pending ? "Posting…" : "Post"}
    </button>
  );
}
