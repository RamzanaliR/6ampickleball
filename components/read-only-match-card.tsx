import type { MatchSet } from "@/lib/types";

export function ReadOnlyMatchCard({
  courtNumber,
  teamALabel,
  teamBLabel,
  sets,
  verified,
}: {
  courtNumber: number | null;
  teamALabel: string;
  teamBLabel: string;
  sets: MatchSet[];
  verified: boolean;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-5">
      <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[var(--color-ink-muted)]">
        Court {courtNumber}
      </p>
      <p className="mt-1 text-[var(--color-ink)]">
        <span className="font-medium">{teamALabel}</span>
        <span className="mx-2 text-[var(--color-ink-muted)]">vs</span>
        <span className="font-medium">{teamBLabel}</span>
      </p>
      <p className="mt-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-ink)]">
        {verified ? (
          sets.map((s) => `${s.a}-${s.b}`).join(", ")
        ) : (
          <span className="text-[var(--color-ink-muted)]">Not played yet</span>
        )}
      </p>
    </div>
  );
}
