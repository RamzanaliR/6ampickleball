"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden rounded-[var(--radius-pill)] bg-[var(--color-court)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)]"
    >
      Print / Save as PDF
    </button>
  );
}
