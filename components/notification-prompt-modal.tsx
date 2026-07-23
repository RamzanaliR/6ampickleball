"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/modal";
import { usePushSubscription } from "@/lib/hooks/use-push-subscription";

const DISMISS_KEY = "push-prompt-dismissed-at";
const COOLDOWN_DAYS = 7;

export function NotificationPromptModal() {
  const { status, error, isPending, enable } = usePushSubscription();
  const [open, setOpen] = useState(false);
  const [justEnabled, setJustEnabled] = useState(false);

  useEffect(() => {
    if (status !== "off") return;

    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const daysSince = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSince < COOLDOWN_DAYS) return;
    }

    const timer = setTimeout(() => setOpen(true), 900);
    return () => clearTimeout(timer);
  }, [status]);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setOpen(false);
  }

  function handleEnable() {
    enable((ok) => {
      if (ok) {
        localStorage.removeItem(DISMISS_KEY);
        setJustEnabled(true);
        setTimeout(() => setOpen(false), 1400);
      }
    });
  }

  if (status !== "off") return null;

  return (
    <Modal open={open} onClose={dismiss} title="Stay in the loop">
      {justEnabled ? (
        <p className="text-sm text-[var(--color-court)]">You&apos;re all set — notifications are on 🎾</p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-ink-muted)]">
            Get notified when a new session goes up, spots are running low, your fixtures are
            ready, and reminders before a session starts.
          </p>
          {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleEnable}
              disabled={isPending}
              className="rounded-[var(--radius-pill)] bg-[var(--color-court)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)] disabled:opacity-60"
            >
              {isPending ? "Working…" : "Enable notifications"}
            </button>
            <button
              type="button"
              onClick={dismiss}
              disabled={isPending}
              className="rounded-[var(--radius-pill)] border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink)]"
            >
              Not now
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
