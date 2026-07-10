"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type { MatchFormState } from "@/lib/actions/matches";

type PlayerOption = { id: string; name: string };

const initialState: MatchFormState = {};

export function MatchForm({
  action,
  players,
  currentPlayerId,
}: {
  action: (prevState: MatchFormState, formData: FormData) => Promise<MatchFormState>;
  players: PlayerOption[];
  currentPlayerId?: string;
}) {
  const [state, formAction] = useActionState(action, initialState);
  const [matchType, setMatchType] = useState<"singles" | "doubles">("singles");
  const [setCount, setSetCount] = useState(1);

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <span className="text-sm font-medium text-[var(--color-ink)]">Match type</span>
        <div className="mt-1.5 flex gap-2">
          <TypeButton active={matchType === "singles"} onClick={() => setMatchType("singles")}>
            Singles
          </TypeButton>
          <TypeButton active={matchType === "doubles"} onClick={() => setMatchType("doubles")}>
            Doubles
          </TypeButton>
        </div>
        <input type="hidden" name="match_type" value={matchType} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TeamFields
          label="Team A"
          prefix="team_a"
          count={matchType === "singles" ? 1 : 2}
          players={players}
          defaultFirst={currentPlayerId}
        />
        <TeamFields
          label="Team B"
          prefix="team_b"
          count={matchType === "singles" ? 1 : 2}
          players={players}
        />
      </div>

      <div>
        <span className="text-sm font-medium text-[var(--color-ink)]">Sets</span>
        <div className="mt-1.5 space-y-2">
          {Array.from({ length: setCount }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-xs text-[var(--color-ink-muted)]">
                Set {i + 1}
              </span>
              <input
                name={`set_${i}_a`}
                type="number"
                min={0}
                required
                placeholder="A"
                className="w-20 rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-1.5 text-center text-[var(--color-ink)] outline-none focus:border-[var(--color-court)]"
              />
              <span className="text-[var(--color-ink-muted)]">–</span>
              <input
                name={`set_${i}_b`}
                type="number"
                min={0}
                required
                placeholder="B"
                className="w-20 rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-1.5 text-center text-[var(--color-ink)] outline-none focus:border-[var(--color-court)]"
              />
            </div>
          ))}
        </div>
        <input type="hidden" name="set_count" value={setCount} />
        <div className="mt-2 flex gap-4 text-sm">
          {setCount < 3 && (
            <button
              type="button"
              onClick={() => setSetCount((c) => c + 1)}
              className="font-medium text-[var(--color-court)]"
            >
              + Add set
            </button>
          )}
          {setCount > 1 && (
            <button
              type="button"
              onClick={() => setSetCount((c) => c - 1)}
              className="font-medium text-[var(--color-ink-muted)]"
            >
              Remove set
            </button>
          )}
        </div>
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

function TeamFields({
  label,
  prefix,
  count,
  players,
  defaultFirst,
}: {
  label: string;
  prefix: "team_a" | "team_b";
  count: number;
  players: PlayerOption[];
  defaultFirst?: string;
}) {
  return (
    <div>
      <span className="text-sm font-medium text-[var(--color-ink)]">{label}</span>
      <div className="mt-1.5 space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <select
            key={i}
            name={`${prefix}_${i + 1}`}
            required
            defaultValue={i === 0 ? (defaultFirst ?? "") : ""}
            className="w-full rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3.5 py-2.5 text-[var(--color-ink)] outline-none focus:border-[var(--color-court)]"
          >
            <option value="" disabled>
              Select player…
            </option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        ))}
      </div>
    </div>
  );
}

function TypeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-[var(--radius-pill)] bg-[var(--color-court)] px-4 py-1.5 text-sm font-semibold text-white"
          : "rounded-[var(--radius-pill)] border border-[var(--color-line)] px-4 py-1.5 text-sm font-medium text-[var(--color-ink)]"
      }
    >
      {children}
    </button>
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
      {pending ? "Submitting…" : "Submit result"}
    </button>
  );
}
