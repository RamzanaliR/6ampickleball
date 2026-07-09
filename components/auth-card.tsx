export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-160px)] max-w-md flex-col justify-center px-6 py-16">
      <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[var(--color-court)]">
        Dar Pickleball Club
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-extrabold uppercase tracking-tight text-[var(--color-ink)]">
        {title}
      </h1>
      <p className="mt-2 text-sm text-[var(--color-ink-muted)]">{subtitle}</p>
      <div className="mt-8 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6">
        {children}
      </div>
    </div>
  );
}

export { FormField } from "@/components/form-field";

