"use client";

import { useEffect, useState, useTransition } from "react";
import { deletePushSubscription, savePushSubscription, sendTestPush } from "@/lib/actions/push";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

type Status = "checking" | "unsupported" | "ios-not-installed" | "off" | "on";

export function NotificationSettings() {
  const [status, setStatus] = useState<Status>("checking");
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function check() {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;

      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus(isIOS && !isStandalone ? "ios-not-installed" : "unsupported");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const existing = await registration.pushManager.getSubscription();
      setStatus(existing ? "on" : "off");
    }
    check().catch(() => setStatus("unsupported"));
  }, []);

  function handleEnable() {
    setError(null);
    startTransition(async () => {
      try {
        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicKey) {
          setError("Push isn't configured on the server yet.");
          return;
        }
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setError("Notifications were blocked. You can re-enable them in your browser/device settings.");
          return;
        }
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
        const result = await savePushSubscription(subscription.toJSON() as never, navigator.userAgent);
        if (result.error) {
          setError(result.error);
          return;
        }
        setStatus("on");
      } catch {
        setError("Couldn't enable notifications. Please try again.");
      }
    });
  }

  function handleDisable() {
    setError(null);
    startTransition(async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await deletePushSubscription(subscription.endpoint);
          await subscription.unsubscribe();
        }
        setStatus("off");
      } catch {
        setError("Couldn't disable notifications. Please try again.");
      }
    });
  }

  function handleTest() {
    setTestResult(null);
    setError(null);
    startTransition(async () => {
      const result = await sendTestPush();
      if (result.error) {
        setError(result.error);
      } else {
        setTestResult("Sent! It should arrive any second.");
      }
    });
  }

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
            onClick={handleDisable}
            disabled={isPending}
            className="rounded-[var(--radius-pill)] border border-[var(--color-line)] px-4 py-1.5 text-sm font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-danger)] hover:text-[var(--color-danger)] disabled:opacity-60"
          >
            {isPending ? "Working…" : "Turn off"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleEnable}
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
          onClick={handleTest}
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
