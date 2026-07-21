export function SessionCapacityMeter({
  capacity,
  filled,
}: {
  capacity: number;
  filled: number;
}) {
  const spotsLeft = Math.max(capacity - filled, 0);
  const showPips = capacity > 0 && capacity <= 40;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[var(--color-ink-muted)]">
          {spotsLeft > 0 ? `${spotsLeft} spots left` : "Full — waitlist open"}
        </p>
        <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink-muted)]">
          {Math.min(filled, capacity)} / {capacity}
        </p>
      </div>
      {showPips && (
        <div className="mt-2 flex flex-wrap gap-1">
          {Array.from({ length: capacity }).map((_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={
                i < filled
                  ? "h-2.5 w-2.5 rounded-[2px] bg-[var(--color-court)]"
                  : "h-2.5 w-2.5 rounded-[2px] border border-[var(--color-line)]"
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
