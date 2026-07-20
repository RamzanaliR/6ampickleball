"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { getNoShowRoster, setNoShow, type NoShowRosterEntry } from "@/lib/actions/no-shows";

export function NoShowModal({
  sessionId,
  triggerLabel = "No-shows",
  triggerClassName,
}: {
  sessionId: string;
  triggerLabel?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roster, setRoster] = useState<NoShowRosterEntry[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleOpen() {
    setOpen(true);
    setError(null);
    setLoading(true);
    startTransition(async () => {
      const result = await getNoShowRoster(sessionId);
      setLoading(false);
      if (result.error) {
        setError(result.error);
      } else {
        setRoster(result.roster ?? []);
      }
    });
  }

  function handleClose() {
    setOpen(false);
    setRoster(null);
    setError(null);
    router.refresh();
  }

  function toggle(playerId: string, checked: boolean) {
    setRoster((prev) =>
      prev ? prev.map((r) => (r.playerId === playerId ? { ...r, noShow: checked } : r)) : prev
    );
    startTransition(async () => {
      const result = await setNoShow(sessionId, playerId, checked);
      if (result.error) {
        setError(result.error);
        // revert optimistic update on failure
        setRoster((prev) =>
          prev ? prev.map((r) => (r.playerId === playerId ? { ...r, noShow: !checked } : r)) : prev
        );
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
      <Modal open={open} onClose={handleClose} title="Flag no-shows">
        <div className="space-y-4">
          <p className="text-xs text-[var(--color-ink-muted)]">
            Everyone confirmed is assumed to have shown up — check anyone who didn&apos;t.
          </p>

          {error && (
            <p className="rounded-[var(--radius-input)] bg-[var(--color-danger-bg)] px-3 py-2 text-sm text-[var(--color-danger)]">
              {error}
            </p>
          )}

          {loading ? (
            <p className="text-sm text-[var(--color-ink-muted)]">Loading…</p>
          ) : !roster || roster.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-muted)]">No one confirmed for this session.</p>
          ) : (
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              {roster.map((r) => (
                <label
                  key={r.playerId}
                  className={`flex items-center gap-2 rounded-[var(--radius-input)] px-2 py-1.5 ${
                    r.noShow ? "bg-[var(--color-danger-bg)]" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={r.noShow}
                    onChange={(e) => toggle(r.playerId, e.target.checked)}
                    className="h-4 w-4 accent-[var(--color-danger)]"
                  />
                  <span
                    className={`text-sm ${
                      r.noShow ? "font-medium text-[var(--color-danger)]" : "text-[var(--color-ink)]"
                    }`}
                  >
                    {r.name}
                  </span>
                </label>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleClose}
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
