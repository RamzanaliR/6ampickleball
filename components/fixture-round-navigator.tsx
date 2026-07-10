"use client";

import { useRef, useState } from "react";

export function FixtureRoundNavigator({
  rounds,
}: {
  rounds: { roundNumber: number; content: React.ReactNode }[];
}) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  if (rounds.length === 0) return null;

  function prev() {
    setIndex((i) => Math.max(0, i - 1));
  }
  function next() {
    setIndex((i) => Math.min(rounds.length - 1, i + 1));
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > 50) prev();
    else if (delta < -50) next();
    touchStartX.current = null;
  }

  const current = rounds[index];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={prev}
          disabled={index === 0}
          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-pill)] border border-[var(--color-line)] text-[var(--color-ink)] transition-colors hover:border-[var(--color-court)] hover:text-[var(--color-court)] disabled:opacity-30"
          aria-label="Previous round"
        >
          ←
        </button>
        <p className="font-[family-name:var(--font-mono)] text-sm font-medium text-[var(--color-ink)]">
          Round {current.roundNumber} of {rounds.length}
        </p>
        <button
          type="button"
          onClick={next}
          disabled={index === rounds.length - 1}
          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-pill)] border border-[var(--color-line)] text-[var(--color-ink)] transition-colors hover:border-[var(--color-court)] hover:text-[var(--color-court)] disabled:opacity-30"
          aria-label="Next round"
        >
          →
        </button>
      </div>
      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {current.content}
      </div>
    </div>
  );
}
