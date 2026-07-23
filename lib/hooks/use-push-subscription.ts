"use client";

import { useEffect, useState, useTransition } from "react";
import { deletePushSubscription, savePushSubscription, sendTestPush } from "@/lib/actions/push";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export type PushStatus = "checking" | "unsupported" | "ios-not-installed" | "off" | "on";

export function usePushSubscription() {
  const [status, setStatus] = useState<PushStatus>("checking");
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

  function enable(onDone?: (ok: boolean) => void) {
    setError(null);
    startTransition(async () => {
      try {
        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicKey) {
          setError("Push isn't configured on the server yet.");
          onDone?.(false);
          return;
        }
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setError("Notifications were blocked. You can re-enable them in your browser/device settings.");
          onDone?.(false);
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
          onDone?.(false);
          return;
        }
        setStatus("on");
        onDone?.(true);
      } catch {
        setError("Couldn't enable notifications. Please try again.");
        onDone?.(false);
      }
    });
  }

  function disable() {
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

  function test() {
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

  return { status, error, testResult, isPending, enable, disable, test };
}
