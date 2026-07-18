"use client";

import { useState, useTransition } from "react";
import { deleteFeedPost } from "@/lib/actions/feed";

export function FeedPostRow({
  postId,
  content,
  imageUrl,
  createdAtLabel,
}: {
  postId: string;
  content: string;
  imageUrl: string | null;
  createdAtLabel: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      try {
        await deleteFeedPost(postId);
        setDeleted(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  if (deleted) return null;

  return (
    <div className="kitchen-line py-4 last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="whitespace-pre-wrap text-[var(--color-ink)]">{content}</p>
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary external URL, next/image would need remotePatterns configured per-domain
            <img
              src={imageUrl}
              alt=""
              className="mt-3 max-h-64 rounded-[var(--radius-input)] object-cover"
            />
          )}
          <p className="mt-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink-muted)]">
            {createdAtLabel}
          </p>
          {error && <p className="mt-1 text-xs text-[var(--color-danger)]">{error}</p>}
        </div>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="shrink-0 text-sm font-medium text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-danger)] disabled:opacity-60"
        >
          {isPending ? "…" : "Delete"}
        </button>
      </div>
    </div>
  );
}
