"use client";

import { formatSessionDate, formatSessionTime } from "@/lib/format";

export function WhatsAppShareButton({
  title,
  dateTime,
  location,
}: {
  title: string;
  dateTime: string;
  location: string;
}) {
  const text = `${title}\n${formatSessionDate(dateTime)} · ${formatSessionTime(dateTime)}\n${location}\n\nSay you're in: ${typeof window !== "undefined" ? window.location.origin : ""}/sessions`;

  const href = `https://wa.me/?text=${encodeURIComponent(text)}`;

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
