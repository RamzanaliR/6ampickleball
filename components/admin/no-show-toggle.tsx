"use client";

import { useState, useTransition } from "react";
import { setNoShow } from "@/lib/actions/no-shows";

export function NoShowToggle({
  sessionId,
  playerId,
  initialChecked,
}: {
  sessionId: string;
  playerId: string;
  initialChecked: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(checked: boolean) {
    setError(null);
    startTransition(async () => {
      try {
        await setNoShow(sessionId, playerId, checked);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <label className="flex items-center gap-2 text-sm text-[var(--color-ink-muted)]">
      {error && <span className="text-xs text-[var(--color-danger)]">{error}</span>}
      <input
        type="checkbox"
        defaultChecked={initialChecked}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.checked)}
        className="h-5 w-5 accent-[var(--color-danger)] disabled:opacity-60"
      />
      No-show
    </label>
  );
}
