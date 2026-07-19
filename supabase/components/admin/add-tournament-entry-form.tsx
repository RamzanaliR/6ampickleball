"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { addTournamentEntry, type EntryFormState } from "@/lib/actions/tournaments";

const initialState: EntryFormState = {};

export function AddTournamentEntryForm({
  tournamentId,
  candidates,
}: {
  tournamentId: string;
  candidates: { id: string; name: string }[];
}) {
  const boundAction = addTournamentEntry.bind(null, tournamentId);
  const [state, formAction] = useActionState(boundAction, initialState);

  if (candidates.length === 0) {
    return <p className="text-sm text-[var(--color-ink-muted)]">Everyone eligible is already in.</p>;
  }

  return (
    <form action={formAction} className="flex flex-wrap items-start gap-3">
      <select
        name="player_id"
        defaultValue=""
        required
        className="rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3.5 py-2.5 text-[var(--color-ink)] outline-none focus:border-[var(--color-court)]"
      >
        <option value="" disabled>
          Select player…
        </option>
        {candidates.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <SubmitButton />
      {state.error && <p className="w-full text-sm text-[var(--color-danger)]">{state.error}</p>}
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-[var(--radius-pill)] bg-[var(--color-court)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)] disabled:opacity-60"
    >
      {pending ? "Adding…" : "Add"}
    </button>
  );
}
