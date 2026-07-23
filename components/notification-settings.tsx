"use client";

import { usePushSubscription } from "@/lib/hooks/use-push-subscription";

export function NotificationSettings() {
  const { status, error, testResult, isPending, enable, disable, test } = usePushSubscription();

  if (status === "checking") return null;

  if (status === "unsupported") {
    return (
      <p className="text-sm text-[var(--color-ink-muted)]">
        Notifications aren&apos;t supported in this browser.
      </p>
    );
  }

  if (status === "ios-not-installed") {
    return (
      <p className="text-sm text-[var(--color-ink-muted)]">
        On iPhone, notifications only work once the app is added to your Home Screen. Tap the
        Share button in Safari, then &quot;Add to Home Screen&quot; — then come back here.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--color-ink-muted)]">Push notifications</span>
        {status === "on" ? (
          <button
            type="button"
            onClick={disable}
            disabled={isPending}
            className="rounded-[var(--radius-pill)] border border-[var(--color-line)] px-4 py-1.5 text-sm font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-danger)] hover:text-[var(--color-danger)] disabled:opacity-60"
          >
            {isPending ? "Working…" : "Turn off"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => enable()}
            disabled={isPending}
            className="rounded-[var(--radius-pill)] bg-[var(--color-court)] px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)] disabled:opacity-60"
          >
            {isPending ? "Working…" : "Enable"}
          </button>
        )}
      </div>
      {status === "on" && (
        <button
          type="button"
          onClick={test}
          disabled={isPending}
          className="text-xs font-medium text-[var(--color-court)] hover:text-[var(--color-court-dark)]"
        >
          Send test notification
        </button>
      )}
      {testResult && <p className="text-xs text-[var(--color-court)]">{testResult}</p>}
      {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}
