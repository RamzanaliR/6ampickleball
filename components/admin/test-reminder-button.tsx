"use client";

import { useState, useTransition } from "react";
import { sendTestReminder } from "@/lib/actions/push";

export function TestReminderButton({ sessionId }: { sessionId: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  function handleClick() {
    setMessage(null);
    startTransition(async () => {
      const result = await sendTestReminder(sessionId);
      if (result.error) {
        setMessage({ text: result.error, isError: true });
      } else {
        setMessage({ text: `Sent to ${result.sent} confirmed player(s).`, isError: false });
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="text-xs font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-court)] disabled:opacity-60"
      >
        {isPending ? "Sending…" : "Test reminder"}
      </button>
      {message && (
        <p className={`mt-0.5 text-[11px] ${message.isError ? "text-[var(--color-danger)]" : "text-[var(--color-court)]"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
