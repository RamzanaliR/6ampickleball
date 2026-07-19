"use client";

import { useState, useTransition } from "react";
import { moderateFeedPost } from "@/lib/actions/feed";
import type { FeedMediaItem } from "@/lib/types";

export function FeedModerationRow({
  postId,
  posterName,
  content,
  media,
  createdAtLabel,
}: {
  postId: string;
  posterName: string;
  content: string;
  media: FeedMediaItem[];
  createdAtLabel: string;
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
    <div className="w-full rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        {media.length > 0 && (
          <div className="flex shrink-0 gap-2 overflow-x-auto sm:w-40">
            {media.map((m, i) =>
              m.type === "video" ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video
                  key={i}
                  src={m.url}
                  className="h-24 w-24 shrink-0 rounded-[var(--radius-input)] object-cover sm:h-20 sm:w-full"
                  muted
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={m.url}
                  alt=""
                  className="h-24 w-24 shrink-0 rounded-[var(--radius-input)] object-cover sm:h-20 sm:w-full"
                />
              )
            )}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-widest text-[var(--color-ink-muted)]">
            {posterName} · {createdAtLabel}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--color-ink)]">{content}</p>
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
      </div>
    </div>
  );
}
