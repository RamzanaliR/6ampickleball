"use client";

import { useState, useTransition } from "react";
import { moderateFeedPost } from "@/lib/actions/feed";

export function FeedModerationRow({
  postId,
  posterName,
  content,
  imageUrl,
}: {
  postId: string;
  posterName: string;
  content: string;
  imageUrl: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);

  function handle(status: "approved" | "rejected") {
    setError(null);
    startTransition(async () => {
      try {
        await moderateFeedPost(postId, status);
        setResolved(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  if (resolved) return null;

  return (
    <div className="kitchen-line py-4 last:border-0">
      <p className="text-xs uppercase tracking-widest text-[var(--color-ink-muted)]">
        {posterName}
      </p>
      <p className="mt-1 whitespace-pre-wrap text-[var(--color-ink)]">{content}</p>
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary external URL
        <img
          src={imageUrl}
          alt=""
          className="mt-3 max-h-48 rounded-[var(--radius-input)] object-cover"
        />
      )}
      {error && <p className="mt-1 text-xs text-[var(--color-danger)]">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => handle("approved")}
          disabled={isPending}
          className="rounded-[var(--radius-pill)] bg-[var(--color-court)] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)] disabled:opacity-60"
        >
          Approve
        </button>
        <button
          onClick={() => handle("rejected")}
          disabled={isPending}
          className="rounded-[var(--radius-pill)] border border-[var(--color-line)] px-4 py-1.5 text-xs font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-danger)] hover:text-[var(--color-danger)] disabled:opacity-60"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
