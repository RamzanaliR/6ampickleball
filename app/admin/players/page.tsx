import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { EmptyState } from "@/components/empty-state";
import { PlayerApprovalRow } from "@/components/admin/player-approval-row";

export default async function AdminPlayersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("players")
    .select("role")
    .eq("id", user.id)
    .single();

  if (me?.role !== "admin") redirect("/dashboard");

  const { data: pending } = await supabase
    .from("players")
    .select("id, name, email, phone, skill_tier")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const { data: roster } = await supabase
    .from("players")
    .select("id, name, email, status, role")
    .neq("status", "pending")
    .eq("is_guest", false)
    .order("name", { ascending: true });

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Players" />
      <div className="mx-auto mt-8 max-w-6xl px-6 pb-16">
        <AdminTabs active="/admin/players" />

        <div className="mt-6 flex justify-end">
          <Link
            href="/admin/players/new"
            className="rounded-[var(--radius-pill)] bg-[var(--color-court)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)]"
          >
            Add member
          </Link>
        </div>

        <section className="mt-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
            Pending approval
          </h2>
          <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] px-6">
            {!pending || pending.length === 0 ? (
              <div className="py-10">
                <EmptyState message="No one waiting on approval right now." />
              </div>
            ) : (
              pending.map((p) => <PlayerApprovalRow key={p.id} player={p} />)
            )}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
            Roster
          </h2>
          <div className="mt-4 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)]">
            {!roster || roster.length === 0 ? (
              <div className="p-10">
                <EmptyState message="No approved or rejected players yet." />
              </div>
            ) : (
              roster.map((p, i) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between px-6 py-3 ${
                    i !== roster.length - 1 ? "kitchen-line" : ""
                  }`}
                >
                  <div>
                    <p className="font-medium text-[var(--color-ink)]">
                      {p.name}
                      {p.role === "admin" && (
                        <span className="ml-2 rounded-[var(--radius-pill)] bg-[var(--color-court)]/10 px-2 py-0.5 text-xs font-semibold text-[var(--color-court)]">
                          Admin
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-[var(--color-ink-muted)]">{p.email}</p>
                  </div>
                  <span
                    className={
                      p.status === "approved"
                        ? "text-sm font-medium text-[var(--color-court)]"
                        : "text-sm font-medium text-[var(--color-danger)]"
                    }
                  >
                    {p.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
