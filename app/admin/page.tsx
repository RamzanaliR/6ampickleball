import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { AdminTabs } from "@/components/admin/admin-tabs";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: player } = await supabase
    .from("players")
    .select("role")
    .eq("id", user.id)
    .single();

  if (player?.role !== "admin") redirect("/dashboard");

  const [
    { count: pendingCount },
    { count: upcomingCount },
    { count: rosterCount },
    { count: pendingMatchCount },
    { count: unpaidCount },
  ] = await Promise.all([
    supabase.from("players").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("sessions").select("id", { count: "exact", head: true }).eq("status", "upcoming"),
    supabase.from("players").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("matches").select("id", { count: "exact", head: true }).eq("verified", false),
    supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "unpaid"),
  ]);

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Club control room" />
      <div className="mx-auto mt-8 max-w-6xl px-6 pb-16">
        <AdminTabs active="/admin" />

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            label="Pending approvals"
            value={pendingCount ?? 0}
            href="/admin/players"
          />
          <StatCard
            label="Upcoming sessions"
            value={upcomingCount ?? 0}
            href="/admin/sessions"
          />
          <StatCard label="Approved players" value={rosterCount ?? 0} href="/admin/players" />
          <StatCard
            label="Results to verify"
            value={pendingMatchCount ?? 0}
            href="/admin/matches"
          />
          <StatCard
            label="Unpaid dues"
            value={unpaidCount ?? 0}
            href="/admin/payments?status=unpaid"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="block rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6 transition-colors hover:border-[var(--color-court)]"
    >
      <p className="text-xs uppercase tracking-widest text-[var(--color-ink-muted)]">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-mono)] text-4xl font-semibold text-[var(--color-ink)]">
        {value}
      </p>
    </Link>
  );
}
