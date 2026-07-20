import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { EmptyState } from "@/components/empty-state";
import { PendingApprovalsButton } from "@/components/admin/pending-approvals-button";
import { AddMemberButton } from "@/components/admin/add-member-button";
import { RemoveMemberButton } from "@/components/admin/remove-member-button";
import { RemoveGuestButton } from "@/components/admin/remove-guest-button";
import { SetDuesButton } from "@/components/admin/set-dues-button";
import { DuesPaidCheckbox } from "@/components/admin/dues-paid-checkbox";
import { EditMemberButton } from "@/components/admin/edit-member-button";
import { EditGuestButton } from "@/components/admin/edit-guest-button";
import { RoleSelectButton } from "@/components/admin/role-select-button";
import { currentDarMonth } from "@/lib/format";

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

  if (me?.role !== "admin" && me?.role !== "manager") redirect("/dashboard");
  const isAdmin = me?.role === "admin";

  const period = currentDarMonth();

  const [
    { data: pending },
    { data: members, error: membersError },
    { data: guests, error: guestsError },
    { data: duesThisMonth },
  ] = await Promise.all([
    supabase
      .from("players")
      .select("id, name, email, phone, skill_tier")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    supabase
      .from("players")
      .select("id, name, nickname, phone, dupr_id, role, monthly_dues_amount")
      .eq("status", "approved")
      .eq("is_guest", false)
      .order("name", { ascending: true }),
    supabase
      .from("players")
      .select("id, name, dupr_id")
      .eq("is_guest", true)
      .eq("status", "approved")
      .order("name", { ascending: true }),
    supabase
      .from("payments")
      .select("player_id, status")
      .eq("direction", "received")
      .eq("type", "membership")
      .eq("period", period),
  ]);

  const paidThisMonthByPlayerId = new Map(
    (duesThisMonth ?? []).map((p) => [p.player_id, p.status === "paid"])
  );

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Players Tables" />
      <div className="mx-auto mt-8 max-w-6xl px-6 pb-16">
        <AdminTabs active="/admin/players" role={isAdmin ? "admin" : "manager"} />

        {isAdmin && (
          <div className="mt-6 flex justify-end gap-3">
            <PendingApprovalsButton initialPending={pending ?? []} />
            <AddMemberButton />
          </div>
        )}

        <div className="mt-6 grid gap-8 md:grid-cols-[2fr_1fr]">
          <section>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
              Club members
            </h2>
            <div className="mt-4 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)]">
              {membersError ? (
                <div className="p-6">
                  <p className="text-sm text-[var(--color-danger)]">
                    Couldn&apos;t load Club Members: {membersError.message}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                    This usually means a database migration hasn&apos;t been run yet — check the
                    latest file in supabase/ against what&apos;s been applied to your project.
                  </p>
                </div>
              ) : !members || members.length === 0 ? (
                <div className="p-10">
                  <EmptyState message="No approved members yet." />
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[var(--color-court)] font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-white">
                      <th className="px-5 py-2.5">Name</th>
                      <th className="whitespace-nowrap px-5 py-2.5">DUPR ID</th>
                      <th className="w-36 whitespace-nowrap px-5 py-2.5">Dues</th>
                      <th className="px-5 py-2.5">Paid</th>
                      <th className="px-5 py-2.5">Role</th>
                      <th className="px-5 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((p, i) => (
                      <tr key={p.id} className={i !== members.length - 1 ? "kitchen-line" : ""}>
                        <td className="px-5 py-2.5 text-sm font-medium text-[var(--color-ink)]">
                          {p.name}
                        </td>
                        <td className="whitespace-nowrap px-5 py-2.5 font-[family-name:var(--font-mono)] text-sm text-[var(--color-ink-muted)]">
                          {p.dupr_id ?? "—"}
                        </td>
                        <td className="w-36 px-5 py-2.5">
                          {isAdmin ? (
                            <SetDuesButton
                              playerId={p.id}
                              playerName={p.name}
                              currentAmount={p.monthly_dues_amount}
                            />
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-5 py-2.5">
                          {isAdmin ? (
                            <DuesPaidCheckbox
                              playerId={p.id}
                              initialChecked={paidThisMonthByPlayerId.get(p.id) ?? false}
                            />
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-5 py-2.5">
                          {isAdmin ? (
                            <RoleSelectButton
                              playerId={p.id}
                              playerName={p.name}
                              currentRole={p.role}
                            />
                          ) : (
                            <span className="text-xs font-medium text-[var(--color-ink-muted)]">
                              {p.role === "admin" ? "Admin" : p.role === "manager" ? "Manager" : "Player"}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-4">
                            <EditMemberButton
                              playerId={p.id}
                              name={p.name}
                              nickname={p.nickname}
                              phone={p.phone}
                              duprId={p.dupr_id}
                              isAdmin={isAdmin}
                            />
                            {isAdmin && (
                              <RemoveMemberButton playerId={p.id} playerName={p.name} />
                            )}
                          </div>
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
              {guestsError ? (
                <div className="p-6">
                  <p className="text-sm text-[var(--color-danger)]">
                    Couldn&apos;t load Guest Players: {guestsError.message}
                  </p>
                </div>
              ) : !guests || guests.length === 0 ? (
                <div className="p-10">
                  <EmptyState message="No guest players yet." />
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[var(--color-court)] font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-white">
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
                          <div className="flex items-center justify-end gap-4">
                            <EditGuestButton playerId={p.id} name={p.name} duprId={p.dupr_id} />
                            {isAdmin && (
                              <RemoveGuestButton playerId={p.id} playerName={p.name} />
                            )}
                          </div>
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
