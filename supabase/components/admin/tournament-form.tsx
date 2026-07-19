"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { FormField } from "@/components/form-field";
import { createTournament, type TournamentFormState } from "@/lib/actions/tournaments";

const initialState: TournamentFormState = {};

export function TournamentForm() {
  const [state, formAction] = useActionState(createTournament, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <FormField label="Name" name="name" placeholder="Summer Round Robin" required />
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Start date" name="start_date" type="date" required />
        <FormField label="End date" name="end_date" type="date" required />
      </div>

      <p className="text-xs text-[var(--color-ink-muted)]">
        These control how cumulative standings are ranked across every week — same choices as a
        single session&apos;s fixture settings, just applied to the whole tournament.
      </p>
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
      {pending ? "Creating…" : "Create tournament"}
    </button>
  );
}
