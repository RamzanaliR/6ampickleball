"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { generateFixtures, type GenerateFixturesState } from "@/lib/actions/fixtures";

const initialState: GenerateFixturesState = {};

export function GenerateFixturesForm({
  sessionId,
  defaultCourts,
  confirmedCount,
}: {
  sessionId: string;
  defaultCourts: number;
  confirmedCount: number;
}) {
  const boundAction = generateFixtures.bind(null, sessionId);
  const [state, formAction] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <p className="text-sm text-[var(--color-ink-muted)]">
        {confirmedCount} player{confirmedCount === 1 ? "" : "s"} confirmed (including guests) ·
        always 10 rounds, Classic Robin.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium text-[var(--color-ink)]">Courts</span>
          <input
            type="number"
            name="courts"
            min={1}
            defaultValue={defaultCourts}
            required
            className="mt-1.5 w-full rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3.5 py-2.5 text-[var(--color-ink)] outline-none focus:border-[var(--color-court)]"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--color-ink)]">Round length</span>
          <select
            name="round_minutes_label"
            defaultValue="10 min"
            className="mt-1.5 w-full rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3.5 py-2.5 text-[var(--color-ink)] outline-none focus:border-[var(--color-court)]"
          >
            <option>8 min</option>
            <option>10 min</option>
            <option>12 min</option>
            <option>15 min</option>
            <option>No limit</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <label className="block">
          <span className="text-sm font-medium text-[var(--color-ink)]">Scoring</span>
          <select
            name="scoring"
            defaultValue="points"
            className="mt-1.5 w-full rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper)] px-2 py-2.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-court)]"
          >
            <option value="points">Win 1 / Loss 0</option>
            <option value="no_points">No points</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--color-ink)]">Rank by</span>
          <select
            name="rank_by"
            defaultValue="wins"
            className="mt-1.5 w-full rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper)] px-2 py-2.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-court)]"
          >
            <option value="wins">Wins</option>
            <option value="points">Points</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--color-ink)]">Tie-break</span>
          <select
            name="tiebreak"
            defaultValue="point_diff"
            className="mt-1.5 w-full rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper)] px-2 py-2.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-court)]"
          >
            <option value="point_diff">Point diff.</option>
            <option value="wins">Wins</option>
          </select>
        </label>
      </div>

      {state.error && (
        <p className="rounded-[var(--radius-input)] bg-[var(--color-danger-bg)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-[var(--radius-pill)] bg-[var(--color-court)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)] disabled:opacity-60"
    >
      {pending ? "Generating…" : "Generate fixtures"}
    </button>
  );
}
