"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { addGuestNamesToSession } from "@/lib/actions/guests";

export function AddGuestModal({
  sessionId,
  knownGuestNames,
  triggerLabel = "Add guest",
  triggerClassName,
}: {
  sessionId: string;
  knownGuestNames: string[];
  triggerLabel?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const takenNames = new Set(
    value
      .split(",")
      .map((n) => n.trim().toLowerCase())
      .filter(Boolean)
  );
  const currentFragment = value.split(",").pop()?.trimStart() ?? "";
  const suggestions =
    currentFragment.length > 0
      ? knownGuestNames
          .filter((n) => n.toLowerCase().includes(currentFragment.toLowerCase()))
          .filter((n) => !takenNames.has(n.toLowerCase()) || n.toLowerCase() === currentFragment.toLowerCase())
          .slice(0, 6)
      : [];

  function pickSuggestion(name: string) {
    const parts = value.split(",");
    parts[parts.length - 1] = ` ${name}`;
    setValue(parts.join(",").replace(/^,\s*/, "") + ", ");
    inputRef.current?.focus();
  }

  function handleClose() {
    setOpen(false);
    setValue("");
    setError(null);
  }

  function handleSubmit() {
    setError(null);
    const names = value
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length === 0) {
      setError("Enter at least one name.");
      return;
    }
    startTransition(async () => {
      const result = await addGuestNamesToSession(sessionId, names);
      if (result.error) {
        setError(result.error);
      } else {
        handleClose();
        router.refresh();
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          triggerClassName ??
          "text-xs font-medium text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-court)]"
        }
      >
        {triggerLabel}
      </button>
      <Modal open={open} onClose={handleClose} title="Add guests">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[var(--color-ink)]">Guest names</label>
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
              Separate multiple names with commas. Already-registered guests will suggest as you
              type — pick one, or just keep typing to add someone new.
            </p>
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. Zara Ali, Farhan Kassam"
              className="mt-2 w-full rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm text-[var(--color-ink)] focus:border-[var(--color-court)] focus:outline-none"
            />
            {suggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestions.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => pickSuggestion(name)}
                    className="rounded-[var(--radius-pill)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-1 text-xs font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-court)] hover:text-[var(--color-court)]"
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="rounded-[var(--radius-input)] bg-[var(--color-danger-bg)] px-3 py-2 text-sm text-[var(--color-danger)]">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="rounded-[var(--radius-pill)] bg-[var(--color-court)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)] disabled:opacity-60"
            >
              {isPending ? "Adding…" : "Add to session"}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="rounded-[var(--radius-pill)] border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink)]"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
