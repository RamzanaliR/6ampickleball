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
    { count: rosterCount },
    { count: guestCount },
    { count: playedCount },
    { count: upcomingCount },
    { count: unpaidCount },
    { count: pendingFeedCount },
  ] = await Promise.all([
    supabase.from("players").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("players").select("id", { count: "exact", head: true }).eq("is_guest", true),
    supabase.from("sessions").select("id", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("sessions").select("id", { count: "exact", head: true }).eq("status", "upcoming"),
    supabase.from("payments").select("id", { count: "exact", head: true }).eq("direction", "received").eq("status", "unpaid"),
    supabase
      .from("community_feed")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Club control room" />
      <div className="mx-auto mt-8 max-w-6xl px-6 pb-16">
        <AdminTabs active="/admin" />

        <div className="mt-6 grid grid-cols-3 gap-3">
          <StatCard label="Club members" value={rosterCount ?? 0} href="/admin/players" />
          <StatCard label="Guest players" value={guestCount ?? 0} href="/admin/players" />
          <StatCard label="Played sessions" value={playedCount ?? 0} href="/admin/sessions" />
          <StatCard
            label="Upcoming sessions"
            value={upcomingCount ?? 0}
            href="/admin/sessions"
          />
          <StatCard
            label="Unpaid dues"
            value={unpaidCount ?? 0}
            href="/admin/payments?status=unpaid"
          />
          <StatCard
            label="Posts to review"
            value={pendingFeedCount ?? 0}
            href="/admin/feed"
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
      className="block rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-3 transition-colors hover:border-[var(--color-court)] sm:p-4"
    >
      <p className="text-[10px] uppercase tracking-widest text-[var(--color-ink-muted)] sm:text-xs">
        {label}
      </p>
      <p className="mt-1 font-[family-name:var(--font-mono)] text-xl font-semibold text-[var(--color-ink)] sm:text-2xl">
        {value}
      </p>
    </Link>
  );
}
