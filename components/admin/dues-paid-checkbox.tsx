"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setDuesPaidStatus } from "@/lib/actions/dues";

export function DuesPaidCheckbox({
  playerId,
  initialChecked,
}: {
  playerId: string;
  initialChecked: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleChange(checked: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await setDuesPaidStatus(playerId, checked);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        defaultChecked={initialChecked}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.checked)}
        className="h-5 w-5 accent-[var(--color-court)] disabled:opacity-60"
        aria-label="This month's dues paid"
      />
      {error && <span className="text-xs text-[var(--color-danger)]">{error}</span>}
    </div>
  );
}
