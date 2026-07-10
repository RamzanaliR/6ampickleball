"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { FormField } from "@/components/form-field";
import type { SessionFormState } from "@/lib/actions/admin-sessions";

const initialState: SessionFormState = {};

export function SessionForm({
  action,
  defaultValues,
  submitLabel,
  tournaments,
}: {
  action: (prevState: SessionFormState, formData: FormData) => Promise<SessionFormState>;
  defaultValues?: {
    title: string;
    date: string;
    time: string;
    location: string;
    capacity: number;
    courts: number | null;
    countsTowardLeaderboard: boolean;
    duprEligible: boolean;
    tournamentId: string | null;
  };
  submitLabel: string;
  tournaments: { id: string; name: string }[];
}) {
  const [state, formAction] = useActionState(action, initialState);
  const [tournamentId, setTournamentId] = useState(defaultValues?.tournamentId ?? "");
  const [addToLeaderboard, setAddToLeaderboard] = useState(
    defaultValues?.countsTowardLeaderboard ?? true
  );
  const inTournament = tournamentId !== "";

  function handleTournamentChange(value: string) {
    setTournamentId(value);
    if (value) setAddToLeaderboard(false);
  }

  return (
    <form action={formAction} className="space-y-4">
      <FormField
        label="Title"
        name="title"
        defaultValue={defaultValues?.title}
        placeholder="Saturday Open Play"
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Date"
          name="date"
          type="date"
          defaultValue={defaultValues?.date}
          required
        />
        <FormField
          label="Time"
          name="time"
          type="time"
          defaultValue={defaultValues?.time}
          required
        />
      </div>
      <FormField
        label="Location"
        name="location"
        defaultValue={defaultValues?.location}
        placeholder="Oyster Bay Courts"
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Capacity"
          name="capacity"
          type="number"
          min={1}
          defaultValue={defaultValues?.capacity}
          required
        />
        <FormField
          label="Courts booked"
          name="courts"
          type="number"
          min={1}
          defaultValue={defaultValues?.courts ?? undefined}
          placeholder="e.g. 4"
        />
      </div>

      {tournaments.length > 0 && (
        <label className="block">
          <span className="text-sm font-medium text-[var(--color-ink)]">
            Part of a tournament?
          </span>
          <select
            name="tournament_id"
            value={tournamentId}
            onChange={(e) => handleTournamentChange(e.target.value)}
            className="mt-1.5 w-full rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3.5 py-2.5 text-[var(--color-ink)] outline-none focus:border-[var(--color-court)]"
          >
            <option value="">No — regular session</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="space-y-2 rounded-[var(--radius-input)] border border-[var(--color-line)] p-4">
        <label className="flex items-start gap-2.5">
          <input
            type="checkbox"
            name="counts_toward_leaderboard"
            checked={inTournament ? false : addToLeaderboard}
            onChange={(e) => setAddToLeaderboard(e.target.checked)}
            disabled={inTournament}
            className="mt-0.5 h-4 w-4 accent-[var(--color-court)] disabled:opacity-50"
          />
          <span className="text-sm text-[var(--color-ink)]">
            Add to leaderboard
            <span className="block text-xs text-[var(--color-ink-muted)]">
              {inTournament
                ? "Off and locked — tournament sessions never count toward the season leaderboard."
                : "Uncheck for a session that shouldn't count toward the season leaderboard. Players will see this on the session."}
            </span>
          </span>
        </label>
        <label className="flex items-start gap-2.5">
          <input
            type="checkbox"
            name="dupr_eligible"
            defaultChecked={defaultValues?.duprEligible ?? false}
            className="mt-0.5 h-4 w-4 accent-[var(--color-court)]"
          />
          <span className="text-sm text-[var(--color-ink)]">
            DUPR session
            <span className="block text-xs text-[var(--color-ink-muted)]">
              Flags this session as one whose results should be reported to DUPR
              manually — no automatic submission yet.
            </span>
          </span>
        </label>
      </div>

      {state.error && (
        <p className="rounded-[var(--radius-input)] bg-[var(--color-danger-bg)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {state.error}
        </p>
      )}

      <SubmitButton label={submitLabel} />
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-[var(--radius-pill)] bg-[var(--color-court)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)] disabled:opacity-60"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}
