"use client";

import { useState, useTransition } from "react";
import { setAttendance } from "@/lib/actions/attendance";

export function AttendanceCheckbox({
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
        await setAttendance(sessionId, playerId, checked);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-[var(--color-danger)]">{error}</span>}
      <input
        type="checkbox"
        defaultChecked={initialChecked}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.checked)}
        className="h-5 w-5 accent-[var(--color-court)] disabled:opacity-60"
      />
    </div>
  );
}
