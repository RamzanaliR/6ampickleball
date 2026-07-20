"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addParticipantNamesToSession } from "@/lib/actions/guests";

export function AddPlayersBox({
  sessionId,
  knownNames,
}: {
  sessionId: string;
  knownNames: string[];
}) {
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
      ? knownNames
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
      const result = await addParticipantNamesToSession(sessionId, names);
      if (result.error) {
        setError(result.error);
      } else {
        setValue("");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      <div>
        <span className="text-sm font-medium text-[var(--color-ink)]">Add players</span>
        <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
          Separate multiple names with commas — members and guests both work. Already-registered
          names will suggest as you type; anything unmatched is added as a new guest.
        </p>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. Aly, Zara Ali, Farhan Kassam"
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

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className="rounded-[var(--radius-pill)] bg-[var(--color-court)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)] disabled:opacity-60"
      >
        {isPending ? "Adding…" : "Add to session"}
      </button>
    </div>
  );
}
