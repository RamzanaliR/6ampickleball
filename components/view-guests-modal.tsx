"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/modal";
import { getSessionGuestRoster, type SessionGuestEntry } from "@/lib/actions/guests";

export function ViewGuestsModal({
  sessionId,
  triggerLabel = "View Guests",
  triggerClassName,
}: {
  sessionId: string;
  triggerLabel?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guests, setGuests] = useState<SessionGuestEntry[] | null>(null);
  const [, startTransition] = useTransition();

  function handleOpen() {
    setOpen(true);
    setError(null);
    setLoading(true);
    startTransition(async () => {
      const result = await getSessionGuestRoster(sessionId);
      setLoading(false);
      if (result.error) {
        setError(result.error);
      } else {
        setGuests(result.guests ?? []);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={
          triggerClassName ??
          "text-xs font-medium text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-court)]"
        }
      >
        {triggerLabel}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Guests this session">
        <div className="space-y-4">
          {error && (
            <p className="rounded-[var(--radius-input)] bg-[var(--color-danger-bg)] px-3 py-2 text-sm text-[var(--color-danger)]">
              {error}
            </p>
          )}
          {loading ? (
            <p className="text-sm text-[var(--color-ink-muted)]">Loading…</p>
          ) : !guests || guests.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-muted)]">No guests confirmed for this session.</p>
          ) : (
            <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)]">
              {guests.map((g, i) => (
                <div
                  key={g.name + i}
                  className={`flex items-center justify-between px-4 py-2.5 ${
                    i !== guests.length - 1 ? "kitchen-line" : ""
                  }`}
                >
                  <span className="text-sm font-medium text-[var(--color-ink)]">{g.name}</span>
                  <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink-muted)]">
                    {g.duprId ?? "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-[var(--radius-pill)] border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink)]"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
