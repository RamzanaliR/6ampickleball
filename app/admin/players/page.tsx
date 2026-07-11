import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { EmptyState } from "@/components/empty-state";
import { PendingApprovalsButton } from "@/components/admin/pending-approvals-button";
import { AddMemberButton } from "@/components/admin/add-member-button";
import { RemoveMemberButton } from "@/components/admin/remove-member-button";
import { RemoveGuestButton } from "@/components/admin/remove-guest-button";

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

  const [{ data: pending }, { data: members }, { data: guests }] = await Promise.all([
    supabase
      .from("players")
      .select("id, name, email, phone, skill_tier")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    supabase
      .from("players")
      .select("id, name, dupr_id, role")
      .eq("status", "approved")
      .eq("is_guest", false)
      .order("name", { ascending: true }),
    supabase
      .from("players")
      .select("id, name, dupr_id")
      .eq("is_guest", true)
      .eq("status", "approved")
      .order("name", { ascending: true }),
  ]);

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Players" />
      <div className="mx-auto mt-8 max-w-6xl px-6 pb-16">
        <AdminTabs active="/admin/players" />

        <div className="mt-6 flex justify-end gap-3">
          <PendingApprovalsButton initialPending={pending ?? []} />
          <AddMemberButton />
        </div>

        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <section>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
              Club members
            </h2>
            <div className="mt-4 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)]">
              {!members || members.length === 0 ? (
                <div className="p-10">
                  <EmptyState message="No approved members yet." />
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="kitchen-line font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[var(--color-ink-muted)]">
                      <th className="px-5 py-2.5">Name</th>
                      <th className="px-5 py-2.5">DUPR ID</th>
                      <th className="px-5 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((p, i) => (
                      <tr key={p.id} className={i !== members.length - 1 ? "kitchen-line" : ""}>
                        <td className="px-5 py-2.5 text-sm font-medium text-[var(--color-ink)]">
                          {p.name}
                          {p.role === "admin" && (
                            <span className="ml-2 rounded-[var(--radius-pill)] bg-[var(--color-court)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-court)]">
                              Admin
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-2.5 font-[family-name:var(--font-mono)] text-sm text-[var(--color-ink-muted)]">
                          {p.dupr_id ?? "—"}
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          <RemoveMemberButton playerId={p.id} playerName={p.name} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
              Guest players
            </h2>
            <div className="mt-4 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)]">
              {!guests || guests.length === 0 ? (
                <div className="p-10">
                  <EmptyState message="No guest players yet." />
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="kitchen-line font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[var(--color-ink-muted)]">
                      <th className="px-5 py-2.5">Name</th>
                      <th className="px-5 py-2.5">DUPR ID</th>
                      <th className="px-5 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {guests.map((p, i) => (
                      <tr key={p.id} className={i !== guests.length - 1 ? "kitchen-line" : ""}>
                        <td className="px-5 py-2.5 text-sm font-medium text-[var(--color-ink)]">{p.name}</td>
                        <td className="px-5 py-2.5 font-[family-name:var(--font-mono)] text-sm text-[var(--color-ink-muted)]">
                          {p.dupr_id ?? "—"}
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          <RemoveGuestButton playerId={p.id} playerName={p.name} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
