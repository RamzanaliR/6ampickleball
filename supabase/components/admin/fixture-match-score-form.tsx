"use client";

import { useState, useTransition } from "react";
import { scoreFixtureMatch, editMatchResult } from "@/lib/actions/fixtures";
import type { MatchSet } from "@/lib/types";

export function FixtureMatchScoreForm({
  matchId,
  sessionId,
  teamALabel,
  teamBLabel,
  initialSets,
  verified,
}: {
  matchId: string;
  sessionId: string;
  teamALabel: string;
  teamBLabel: string;
  initialSets: MatchSet[];
  verified: boolean;
}) {
  const [editing, setEditing] = useState(!verified);
  const [savedSets, setSavedSets] = useState(initialSets);
  const [sets, setSets] = useState<{ a: string; b: string }[]>(
    initialSets.length > 0
      ? initialSets.map((s) => ({ a: String(s.a), b: String(s.b) }))
      : [{ a: "", b: "" }]
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function updateSet(i: number, side: "a" | "b", value: string) {
    setSets((prev) => prev.map((s, idx) => (idx === i ? { ...s, [side]: value } : s)));
  }

  function addSet() {
    if (sets.length < 3) setSets((prev) => [...prev, { a: "", b: "" }]);
  }

  function removeSet() {
    if (sets.length > 1) setSets((prev) => prev.slice(0, -1));
  }

  function handleSave() {
    setError(null);
    const parsed: MatchSet[] = [];
    for (const s of sets) {
      const a = Number(s.a);
      const b = Number(s.b);
      if (s.a === "" || s.b === "" || Number.isNaN(a) || Number.isNaN(b)) {
        setError("Fill in every set.");
        return;
      }
      parsed.push({ a, b });
    }

    startTransition(async () => {
      try {
        if (verified) {
          await editMatchResult(matchId, parsed, [`/admin/sessions/${sessionId}/fixtures`]);
        } else {
          await scoreFixtureMatch(matchId, sessionId, parsed);
        }
        setSavedSets(parsed);
        setEditing(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between">
        <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-ink)]">
          {savedSets.map((s) => `${s.a}-${s.b}`).join(", ")}
        </p>
        <button
          onClick={() => setEditing(true)}
          className="text-xs font-medium text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-court)]"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sets.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-16 shrink-0 truncate text-xs text-[var(--color-ink-muted)]">
            {teamALabel}
          </span>
          <input
            type="number"
            min={0}
            value={s.a}
            onChange={(e) => updateSet(i, "a", e.target.value)}
            className="w-14 rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper)] px-2 py-1 text-center text-sm outline-none focus:border-[var(--color-court)]"
          />
          <span className="text-[var(--color-ink-muted)]">–</span>
          <input
            type="number"
            min={0}
            value={s.b}
            onChange={(e) => updateSet(i, "b", e.target.value)}
            className="w-14 rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper)] px-2 py-1 text-center text-sm outline-none focus:border-[var(--color-court)]"
          />
          <span className="w-16 shrink-0 truncate text-xs text-[var(--color-ink-muted)]">
            {teamBLabel}
          </span>
        </div>
      ))}

      <div className="flex items-center gap-3 text-xs">
        {sets.length < 3 && (
          <button type="button" onClick={addSet} className="font-medium text-[var(--color-court)]">
            + set
          </button>
        )}
        {sets.length > 1 && (
          <button
            type="button"
            onClick={removeSet}
            className="font-medium text-[var(--color-ink-muted)]"
          >
            remove set
          </button>
        )}
      </div>

      {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-[var(--radius-pill)] bg-[var(--color-court)] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)] disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save score"}
        </button>
        {verified && (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-xs font-medium text-[var(--color-ink-muted)]"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
