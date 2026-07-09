import Link from "next/link";

const tabs = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/players", label: "Players" },
  { href: "/admin/sessions", label: "Sessions" },
];

export function AdminTabs({ active }: { active: string }) {
  return (
    <div className="kitchen-line flex gap-6 pb-4">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={
            tab.href === active
              ? "text-sm font-semibold text-[var(--color-court)]"
              : "text-sm font-medium text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-court)]"
          }
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
