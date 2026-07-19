export function EmptyState({ message }: { message: string }) {
  return (
    <div className="kitchen-line rounded-[var(--radius-card)] border border-dashed border-[var(--color-line)] bg-[var(--color-paper-raised)] p-10 text-center">
      <p className="text-[var(--color-ink-muted)]">{message}</p>
    </div>
  );
}
