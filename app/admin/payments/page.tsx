import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { EmptyState } from "@/components/empty-state";
import { PaymentStatusToggle } from "@/components/admin/payment-status-toggle";
import { AddPaymentButton } from "@/components/admin/add-payment-button";
import { formatTZS } from "@/lib/format";

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ player?: string; session?: string; status?: string; period?: string }>;
}) {
  const params = await searchParams;
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

  let receivedQuery = supabase
    .from("payments")
    .select("id, player_id, session_id, period, amount, type, status")
    .eq("direction", "received")
    .order("created_at", { ascending: false });

  if (params.player) receivedQuery = receivedQuery.eq("player_id", params.player);
  if (params.session) receivedQuery = receivedQuery.eq("session_id", params.session);
  if (params.status) receivedQuery = receivedQuery.eq("status", params.status);
  if (params.period) receivedQuery = receivedQuery.ilike("period", `%${params.period}%`);

  const [{ data: received }, { data: paid }, { data: players }, { data: sessions }] =
    await Promise.all([
      receivedQuery,
      supabase
        .from("payments")
        .select("id, paid_to, description, amount, status")
        .eq("direction", "paid")
        .order("created_at", { ascending: false }),
      supabase
        .from("players")
        .select("id, name, is_guest")
        .or("status.eq.approved,is_guest.eq.true")
        .order("name"),
      supabase.from("sessions").select("id, title").order("date_time", { ascending: false }),
    ]);

  const nameById = new Map((players ?? []).map((p) => [p.id, p.name]));
  const sessionTitleById = new Map((sessions ?? []).map((s) => [s.id, s.title]));
  const hasFilters = Boolean(params.player || params.session || params.status || params.period);

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Finances" />
      <div className="mx-auto mt-8 max-w-6xl px-6 pb-16">
        <AdminTabs active="/admin/payments" />

        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <form method="get" className="flex flex-wrap items-center gap-3">
            <select
              name="player"
              defaultValue={params.player ?? ""}
              className="rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-court)]"
            >
              <option value="">All players</option>
              {(players ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              name="session"
              defaultValue={params.session ?? ""}
              className="rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-court)]"
            >
              <option value="">All sessions</option>
              {(sessions ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
            <select
              name="status"
              defaultValue={params.status ?? ""}
              className="rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-court)]"
            >
              <option value="">All statuses</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
            <input
              name="period"
              defaultValue={params.period ?? ""}
              placeholder="Period e.g. 2026-07"
              className="rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-court)]"
            />
            <button
              type="submit"
              className="rounded-[var(--radius-pill)] border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-court)] hover:text-[var(--color-court)]"
            >
              Filter
            </button>
            {hasFilters && (
              <Link
                href="/admin/payments"
                className="text-sm font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-court)]"
              >
                Clear
              </Link>
            )}
          </form>
          <AddPaymentButton
            players={(players ?? []).map((p) => ({ id: p.id, name: p.name, is_guest: p.is_guest }))}
            sessions={sessions ?? []}
          />
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <section>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
              Received
            </h2>
            <div className="mt-4">
              {!received || received.length === 0 ? (
                <EmptyState message="No payments match these filters." />
              ) : (
                <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)]">
                  {received.map((p, i) => (
                    <div
                      key={p.id}
                      className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${
                        i !== received.length - 1 ? "kitchen-line" : ""
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-[var(--color-ink)]">
                          {nameById.get(p.player_id ?? "") ?? "Unknown"}
                        </p>
                        <p className="truncate text-sm text-[var(--color-ink-muted)]">
                          {p.type === "session_fee" ? "Session" : "Membership"} ·{" "}
                          {p.type === "session_fee"
                            ? (sessionTitleById.get(p.session_id ?? "") ?? "Session fee")
                            : p.period}
                        </p>
                      </div>
                      <p className="shrink-0 font-[family-name:var(--font-mono)] text-sm font-semibold text-[var(--color-ink)] sm:w-28 sm:text-center">
                        {formatTZS(p.amount)}
                      </p>
                      <div className="flex shrink-0 items-center gap-3">
                        <span
                          className={
                            p.status === "paid"
                              ? "text-sm font-medium text-[var(--color-court)]"
                              : "text-sm font-medium text-[var(--color-danger)]"
                          }
                        >
                          {p.status}
                        </span>
                        <PaymentStatusToggle paymentId={p.id} status={p.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
              Paid
            </h2>
            <div className="mt-4">
              {!paid || paid.length === 0 ? (
                <EmptyState message="Nothing logged yet." />
              ) : (
                <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)]">
                  {paid.map((p, i) => (
                    <div
                      key={p.id}
                      className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${
                        i !== paid.length - 1 ? "kitchen-line" : ""
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-[var(--color-ink)]">
                          {p.paid_to}
                        </p>
                        {p.description && (
                          <p className="truncate text-sm text-[var(--color-ink-muted)]">
                            {p.description}
                          </p>
                        )}
                      </div>
                      <p className="shrink-0 font-[family-name:var(--font-mono)] text-sm font-semibold text-[var(--color-ink)] sm:w-28 sm:text-center">
                        {formatTZS(p.amount)}
                      </p>
                      <div className="flex shrink-0 items-center gap-3">
                        <span
                          className={
                            p.status === "paid"
                              ? "text-sm font-medium text-[var(--color-court)]"
                              : "text-sm font-medium text-[var(--color-danger)]"
                          }
                        >
                          {p.status}
                        </span>
                        <PaymentStatusToggle paymentId={p.id} status={p.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
