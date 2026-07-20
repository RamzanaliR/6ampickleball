"use client";

import { useState, useTransition } from "react";
import { cancelRsvp, rsvpToSession } from "@/lib/actions/rsvp";

type RsvpState = "confirmed" | "waitlisted" | "none";

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3.5 8.5l3 3 6-6.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RsvpButton({
  sessionId,
  initialStatus,
  full,
}: {
  sessionId: string;
  initialStatus: RsvpState;
  full: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        if (initialStatus === "none") {
          await rsvpToSession(sessionId);
        } else {
          await cancelRsvp(sessionId);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  const label =
    initialStatus === "confirmed"
      ? "Cancel"
      : initialStatus === "waitlisted"
        ? "Leave waitlist"
        : full
          ? "Join waitlist"
          : "I'm in";

  const isCancelStyle = initialStatus !== "none";
  const showCheck = label === "I'm in" || label === "Cancel";

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isPending}
        className={
          isCancelStyle
            ? "w-full rounded-[var(--radius-pill)] border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-danger)] hover:text-[var(--color-danger)] disabled:opacity-60"
            : "w-full rounded-[var(--radius-pill)] bg-[var(--color-court)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)] disabled:opacity-60"
        }
      >
        <span className="inline-flex items-center justify-center gap-1.5">
          {isPending ? (
            "…"
          ) : (
            <>
              {showCheck && <CheckIcon />}
              {label}
            </>
          )}
        </span>
      </button>
      {error && <p className="mt-1.5 text-xs text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}
