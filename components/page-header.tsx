export function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-6xl px-6 pt-12">
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
  );
}
