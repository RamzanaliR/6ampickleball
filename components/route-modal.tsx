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
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
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
