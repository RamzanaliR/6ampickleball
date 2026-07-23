"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { usePushSubscription } from "@/lib/hooks/use-push-subscription";
import {
  updateNotificationPreferences,
  type NotificationPreferences,
  type UpdatePreferencesState,
} from "@/lib/actions/notification-preferences";

const initialState: UpdatePreferencesState = {};

function PreferenceRow({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-sm text-[var(--color-ink)]">{label}</span>
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 accent-[var(--color-court)]"
      />
    </label>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-[var(--radius-pill)] bg-[var(--color-court)] px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)] disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save preferences"}
    </button>
  );
}

export function NotificationsPanel({
  initialPrefs,
  isStaff,
}: {
  initialPrefs: NotificationPreferences;
  isStaff: boolean;
}) {
  const { status, error, testResult, isPending, enable, disable, test } = usePushSubscription();
  const [prefState, prefAction] = useActionState(updateNotificationPreferences, initialState);

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
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--color-ink)]">Push notifications</p>
          <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
            New sessions, spots filling up, fixtures ready, and reminders.
          </p>
        </div>
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
        <form action={prefAction} className="kitchen-line mt-4 pt-4">
          <p className="text-xs uppercase tracking-widest text-[var(--color-ink-muted)]">
            What you&apos;ll be notified about
          </p>
          <div className="mt-2 divide-y divide-[var(--color-line)]">
            <PreferenceRow
              label="New sessions posted"
              name="notify_new_session"
              defaultChecked={initialPrefs.notifyNewSession}
            />
            <PreferenceRow
              label="Spots filling up (10 / 5 / 2 left)"
              name="notify_spots_remaining"
              defaultChecked={initialPrefs.notifySpotsRemaining}
            />
            <PreferenceRow
              label="Your fixtures are ready"
              name="notify_fixtures_ready"
              defaultChecked={initialPrefs.notifyFixturesReady}
            />
            <PreferenceRow
              label="Reminders before a session"
              name="notify_reminders"
              defaultChecked={initialPrefs.notifyReminders}
            />
            {isStaff && (
              <PreferenceRow
                label="Club posts awaiting approval"
                name="notify_club_posts_pending"
                defaultChecked={initialPrefs.notifyClubPostsPending}
              />
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <SaveButton />
            <button
              type="button"
              onClick={test}
              disabled={isPending}
              className="text-xs font-medium text-[var(--color-court)] hover:text-[var(--color-court-dark)]"
            >
              Send test notification
            </button>
          </div>
          {prefState.success && <p className="mt-2 text-xs text-[var(--color-court)]">Saved.</p>}
          {prefState.error && <p className="mt-2 text-xs text-[var(--color-danger)]">{prefState.error}</p>}
        </form>
      )}

      {testResult && <p className="mt-2 text-xs text-[var(--color-court)]">{testResult}</p>}
      {error && <p className="mt-2 text-xs text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}
