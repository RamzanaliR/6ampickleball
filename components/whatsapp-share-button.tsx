"use client";

import { formatSessionDate, formatSessionTime } from "@/lib/format";

function ShareIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M11 5.5a2 2 0 100-4 2 2 0 000 4zM5 10a2 2 0 100-4 2 2 0 000 4zM11 14.5a2 2 0 100-4 2 2 0 000 4z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path d="M6.7 8.9l2.7 3.7M9.4 3.6L6.7 7.1" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function WhatsAppShareButton({
  title,
  dateTime,
  location,
  iconOnly = false,
}: {
  title: string;
  dateTime: string;
  location: string;
  iconOnly?: boolean;
}) {
  const text = `${title}\n${formatSessionDate(dateTime)} · ${formatSessionTime(dateTime)}\n${location}\n\nSay you're in: ${typeof window !== "undefined" ? window.location.origin : ""}/sessions`;

  const href = `https://wa.me/?text=${encodeURIComponent(text)}`;

  if (iconOnly) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on WhatsApp"
        title="Share on WhatsApp"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--color-line)] text-[var(--color-ink-muted)] transition-colors hover:border-[var(--color-court)] hover:text-[var(--color-court)]"
      >
        <ShareIcon />
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--color-line)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-court)] hover:text-[var(--color-court)]"
    >
      Share on WhatsApp
    </a>
  );
}
