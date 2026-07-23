"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function RouteModal({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);

  function close() {
    router.back();
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);

    // Plain `overflow: hidden` on body doesn't reliably stop background
    // scroll/rubber-banding on iOS Safari. Locking the body in place with
    // position:fixed (and restoring the exact scroll offset on close) is
    // the pattern that actually holds on iOS.
    const scrollY = window.scrollY;
    const body = document.body;
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.overflow = "";
      window.scrollTo(0, scrollY);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) close();
      }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[var(--color-ink)]/40 px-4 py-8 sm:py-14"
    >
      <div className="relative w-full max-w-4xl rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] shadow-xl">
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-paper-raised)] text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-line)] hover:text-[var(--color-ink)]"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
