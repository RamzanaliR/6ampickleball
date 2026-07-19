export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-6 pt-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[var(--color-court)]">
            {eyebrow}
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-extrabold uppercase tracking-tight text-[var(--color-ink)] md:text-5xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 max-w-xl text-[var(--color-ink-muted)]">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
