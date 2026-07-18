"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { NoShowToggle } from "@/components/admin/no-show-toggle";
import { regenerateFixtures } from "@/lib/actions/fixtures";
import type { GenerateFixturesState } from "@/lib/actions/fixtures";
import type { FixtureSettings } from "@/lib/types";

const initialState: GenerateFixturesState = {};

export function RegenerateFixturesPanel({
  sessionId,
  confirmedPlayers,
  settings,
}: {
  sessionId: string;
  confirmedPlayers: { id: string; name: string; noShow: boolean }[];
  settings: FixtureSettings | null;
}) {
  const boundAction = regenerateFixtures.bind(null, sessionId);
  const [state, formAction] = useActionState(boundAction, initialState);

  return (
    <details className="group rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)]">
      <summary className="cursor-pointer list-none px-5 py-3 text-sm font-medium text-[var(--color-ink)] transition-colors hover:text-[var(--color-court)]">
        Someone not show up? Edit the list &amp; regenerate
      </summary>
      <div className="kitchen-line space-y-5 p-5">
        <div>
          <p className="mb-2 text-xs uppercase tracking-widest text-[var(--color-ink-muted)]">
            Confirmed players
          </p>
          <div className="overflow-hidden rounded-[var(--radius-input)] border border-[var(--color-line)]">
            {confirmedPlayers.map((p, i) => (
              <div
                key={p.id}
                className={`flex items-center justify-between px-4 py-2.5 ${
                  i !== confirmedPlayers.length - 1 ? "kitchen-line" : ""
                } ${p.noShow ? "bg-[var(--color-danger-bg)]" : ""}`}
              >
                <p className={p.noShow ? "text-sm text-[var(--color-danger)]" : "text-sm text-[var(--color-ink)]"}>
                  {p.name}
                </p>
                <NoShowToggle sessionId={sessionId} playerId={p.id} initialChecked={p.noShow} />
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-[var(--color-ink-muted)]">
            Flag anyone who didn&apos;t show up above, then regenerate — they&apos;ll be left out
            of the new schedule. This replaces the current fixtures and clears any scores already
            entered.
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-[var(--color-ink)]">Courts</span>
              <input
                type="number"
                name="courts"
                min={1}
                defaultValue={settings?.courts ?? 4}
                required
                className="mt-1.5 w-full rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3.5 py-2.5 text-[var(--color-ink)] outline-none focus:border-[var(--color-court)]"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[var(--color-ink)]">Round length</span>
              <select
                name="round_minutes_label"
                defaultValue={settings?.roundMinutesLabel ?? "10 min"}
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

          <input type="hidden" name="scoring" value={settings?.scoring ?? "points"} />
          <input type="hidden" name="rank_by" value={settings?.rankBy ?? "wins"} />
          <input type="hidden" name="tiebreak" value={settings?.tiebreak ?? "point_diff"} />

          {state.error && (
            <p className="rounded-[var(--radius-input)] bg-[var(--color-danger-bg)] px-3 py-2 text-sm text-[var(--color-danger)]">
              {state.error}
            </p>
          )}

          <SubmitButton />
        </form>
      </div>
    </details>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-[var(--radius-pill)] bg-[var(--color-danger)] px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60"
    >
      {pending ? "Regenerating…" : "Regenerate fixtures"}
    </button>
  );
}
