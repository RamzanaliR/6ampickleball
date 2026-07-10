"use client";

import { useEffect, useRef } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={onClose}
      className="w-full max-w-lg rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-0 backdrop:bg-[var(--color-ink)]/40"
    >
      <div className="flex items-center justify-between border-b border-[var(--color-line)] px-6 py-4">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold uppercase tracking-tight text-[var(--color-ink)]">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-pill)] text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-paper)] hover:text-[var(--color-ink)]"
        >
          ✕
        </button>
      </div>
      <div className="max-h-[70vh] overflow-y-auto px-6 py-6">{children}</div>
    </dialog>
  );
}
