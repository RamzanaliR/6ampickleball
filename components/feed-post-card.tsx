"use client";

import { useEffect, useRef, useState } from "react";
import type { FeedMediaItem } from "@/lib/types";

export type FeedListPost = {
  id: string;
  content: string;
  media: FeedMediaItem[];
  posterName: string;
  createdAtLabel: string;
  statusLabel: "pending" | "rejected" | null;
};

export function FeedGalleryList({ posts }: { posts: FeedListPost[] }) {
  const [selected, setSelected] = useState<FeedListPost | null>(null);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {posts.map((post) => (
        <button
          key={post.id}
          type="button"
          onClick={() => setSelected(post)}
          className="flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] text-left transition-colors hover:border-[var(--color-court)]"
        >
          {post.media.length > 0 && (
            <div className="relative aspect-video w-full shrink-0 bg-[var(--color-paper)]">
              {post.media[0].type === "video" ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video src={post.media[0].url} className="h-full w-full object-cover" muted />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.media[0].url} alt="" className="h-full w-full object-cover" />
              )}
              {post.media.length > 1 && (
                <span className="absolute bottom-2 right-2 rounded-[var(--radius-pill)] bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
                  +{post.media.length - 1}
                </span>
              )}
            </div>
          )}
          <div className="flex flex-1 flex-col gap-2 p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="line-clamp-3 whitespace-pre-wrap text-sm text-[var(--color-ink)]">
                {post.content}
              </p>
              {post.statusLabel && (
                <span
                  className={
                    post.statusLabel === "pending"
                      ? "shrink-0 rounded-[var(--radius-pill)] border border-[var(--color-ball)] bg-[var(--color-ball)]/30 px-2.5 py-1 text-[10px] font-semibold text-[var(--color-ink)]"
                      : "shrink-0 rounded-[var(--radius-pill)] border border-[var(--color-line)] px-2.5 py-1 text-[10px] font-semibold text-[var(--color-ink-muted)]"
                  }
                >
                  {post.statusLabel === "pending" ? "Pending" : "Rejected"}
                </span>
              )}
            </div>
            <p className="mt-auto font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-[var(--color-ink-muted)]">
              {post.posterName} · {post.createdAtLabel}
            </p>
          </div>
        </button>
      ))}

      <GalleryDialog post={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function GalleryDialog({ post, onClose }: { post: FeedListPost | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (post && !dialog.open) dialog.showModal();
    if (!post && dialog.open) dialog.close();
  }, [post]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="m-auto w-full max-w-4xl rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-0 backdrop:bg-[var(--color-ink)]/60"
    >
      {post && (
        <div className="flex max-h-[85vh] flex-col md:flex-row">
          {post.media.length > 0 && (
            <div className="flex shrink-0 gap-2 overflow-x-auto bg-black md:w-3/5 md:flex-col md:overflow-y-auto md:overflow-x-hidden">
              {post.media.map((m, i) =>
                m.type === "video" ? (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <video
                    key={i}
                    src={m.url}
                    controls
                    className="max-h-[85vh] w-full shrink-0 snap-center object-contain md:h-auto"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={m.url}
                    alt=""
                    className="max-h-[85vh] w-full shrink-0 snap-center object-contain md:h-auto"
                  />
                )
              )}
            </div>
          )}
          <div className="flex flex-1 flex-col p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[var(--color-ink-muted)]">
                {post.posterName} · {post.createdAtLabel}
              </p>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-pill)] text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-paper)] hover:text-[var(--color-ink)]"
              >
                ✕
              </button>
            </div>
            <p className="whitespace-pre-wrap text-[var(--color-ink)]">{post.content}</p>
            {post.statusLabel && (
              <span
                className={
                  post.statusLabel === "pending"
                    ? "mt-4 w-fit rounded-[var(--radius-pill)] border border-[var(--color-ball)] bg-[var(--color-ball)]/30 px-3 py-1 text-xs font-semibold text-[var(--color-ink)]"
                    : "mt-4 w-fit rounded-[var(--radius-pill)] border border-[var(--color-line)] px-3 py-1 text-xs font-semibold text-[var(--color-ink-muted)]"
                }
              >
                {post.statusLabel === "pending" ? "Pending review" : "Rejected"}
              </span>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}
