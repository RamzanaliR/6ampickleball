"use client";

import { formatSessionDate, formatSessionTime } from "@/lib/format";

function WhatsAppGlyph() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2a10 10 0 00-8.6 15.1L2 22l5.06-1.33A10 10 0 1012 2z"
        fill="#25D366"
      />
      <path
        d="M8.6 6.9c-.24-.53-.4-.55-.63-.56h-.53c-.19 0-.5.07-.76.35-.26.28-1 .97-1 2.38 0 1.4 1.02 2.76 1.17 2.95.14.19 1.98 3.16 4.9 4.31 2.42.96 2.92.77 3.44.72.53-.05 1.7-.7 1.94-1.36.24-.67.24-1.25.17-1.37-.07-.12-.26-.19-.53-.33-.28-.14-1.7-.84-1.96-.94-.26-.09-.46-.14-.65.15-.19.28-.75.93-.92 1.13-.17.19-.34.21-.62.07-.28-.14-1.19-.44-2.27-1.4-.84-.75-1.4-1.67-1.57-1.95-.16-.28-.02-.43.13-.57.13-.13.28-.34.42-.51.14-.17.19-.28.28-.47.09-.19.05-.36-.02-.5-.07-.14-.6-1.53-.85-2.09z"
        fill="#fff"
      />
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
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--color-line)] transition-opacity hover:opacity-80"
      >
        <WhatsAppGlyph />
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
