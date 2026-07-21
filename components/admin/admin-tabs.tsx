import Link from "next/link";

const tabs = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/players", label: "Players" },
  { href: "/admin/sessions", label: "Sessions" },
  { href: "/admin/tournaments", label: "Tournaments" },
  { href: "/admin/payments", label: "Finances" },
  { href: "/admin/feed", label: "The Club" },
  { href: "/admin/hero", label: "Homepage" },
];

// Managers only get the tabs that lead to pages they actually have
// access to — Tournaments, Finances, and anything else stays
// admin-only and simply isn't shown as a tab.
const managerTabHrefs = new Set(["/admin", "/admin/players", "/admin/sessions", "/admin/feed"]);

export function AdminTabs({ active, role }: { active: string; role?: "admin" | "manager" }) {
  const visibleTabs = role === "manager" ? tabs.filter((t) => managerTabHrefs.has(t.href)) : tabs;

  return (
    <div className="kitchen-line flex flex-wrap gap-x-6 gap-y-3 pb-4">
      {visibleTabs.map((tab) => (
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
