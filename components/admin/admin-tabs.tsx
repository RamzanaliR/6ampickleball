import Link from "next/link";

const tabs = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/players", label: "Players" },
  { href: "/admin/sessions", label: "Sessions" },
  { href: "/admin/tournaments", label: "Tournaments" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/feed", label: "The Club" },
];

export function AdminTabs({ active }: { active: string }) {
  return (
    <div className="kitchen-line -mx-6 flex gap-6 overflow-x-auto px-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={
            tab.href === active
              ? "shrink-0 whitespace-nowrap text-sm font-semibold text-[var(--color-court)]"
              : "shrink-0 whitespace-nowrap text-sm font-medium text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-court)]"
          }
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
