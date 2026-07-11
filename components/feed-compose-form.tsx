"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { createFeedPostPlayer, type FeedFormState } from "@/lib/actions/feed";
import { FeedMediaUploader } from "@/components/feed-media-uploader";

const initialState: FeedFormState = {};

export function FeedComposeForm({
  userId,
  onPosted,
}: {
  userId: string;
  onPosted?: () => void;
}) {
  const [state, formAction] = useActionState(createFeedPostPlayer, initialState);

  useEffect(() => {
    if (state.success) onPosted?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <form action={formAction} className="space-y-3">
      <textarea
        name="content"
        required
        rows={3}
        placeholder="Share something with the club — a birthday shoutout, tournament photo, get-together..."
        className="w-full rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3.5 py-2.5 text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-court)]"
      />

      <FeedMediaUploader userId={userId} />

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
      {pending ? "Posting…" : "Post to The Club"}
    </button>
  );
}
