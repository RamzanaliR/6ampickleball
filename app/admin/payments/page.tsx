import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { EmptyState } from "@/components/empty-state";
import { PaymentStatusToggle } from "@/components/admin/payment-status-toggle";
import { AddPaymentButton } from "@/components/admin/add-payment-button";
import { FinancesFilterForm } from "@/components/admin/finances-filter-form";
import { formatTZS, currentDarMonth, shiftMonth, monthLabel } from "@/lib/format";

type SearchParams = {
  player?: string;
  session?: string;
  month?: string;
};

function buildHref(params: SearchParams, overrides: Partial<SearchParams>) {
  const merged = { ...params, ...overrides };
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value) qs.set(key, value);
  }
  const query = qs.toString();
  return query ? `/admin/payments?${query}` : "/admin/payments";
}

function monthRange(month: string) {
  const start = `${month}-01T00:00:00+03:00`;
  const end = `${shiftMonth(month, 1)}-01T00:00:00+03:00`;
  return { start, end };
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
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

  const month = params.month || currentDarMonth();
  const range = monthRange(month);

  let receivedQuery = supabase
    .from("payments")
    .select("id, player_id, session_id, period, amount, type, status")
    .eq("direction", "received")
    .eq("status", "paid")
    .gte("created_at", range.start)
    .lt("created_at", range.end)
    .order("created_at", { ascending: false });

  if (params.player) receivedQuery = receivedQuery.eq("player_id", params.player);
  if (params.session) receivedQuery = receivedQuery.eq("session_id", params.session);

  const paidQuery = supabase
    .from("payments")
    .select("id, paid_to, description, amount, status")
    .eq("direction", "paid")
    .gte("created_at", range.start)
    .lt("created_at", range.end)
    .order("created_at", { ascending: false });

  const [{ data: received }, { data: paid }, { data: players }, { data: sessions }] =
    await Promise.all([
      receivedQuery,
      paidQuery,
      supabase
        .from("players")
        .select("id, name, is_guest, monthly_dues_amount")
        .eq("status", "approved")
        .order("name"),
      supabase.from("sessions").select("id, title").order("date_time", { ascending: false }),
    ]);

  const nameById = new Map((players ?? []).map((p) => [p.id, p.name]));
  const duesByPlayerId = new Map((players ?? []).map((p) => [p.id, p.monthly_dues_amount]));
  const sessionTitleById = new Map((sessions ?? []).map((s) => [s.id, s.title]));

  const receivedTotal = (received ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const paidTotal = (paid ?? []).reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Finances" />
      <div className="mx-auto mt-8 max-w-6xl px-6 pb-16">
        <AdminTabs active="/admin/payments" />

        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <FinancesFilterForm
            players={(players ?? []).map((p) => ({ id: p.id, name: p.name }))}
            sessions={sessions ?? []}
            player={params.player ?? ""}
            session={params.session ?? ""}
            month={month}
          />
          <AddPaymentButton
            players={(players ?? []).map((p) => ({ id: p.id, name: p.name, is_guest: p.is_guest }))}
            sessions={sessions ?? []}
            duesByPlayerId={duesByPlayerId}
          />
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <section>
            <div className="flex h-9 items-center justify-between gap-3">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
                Received
              </h2>
              <div className="flex shrink-0 items-center gap-3">
                <Link
                  href={buildHref(params, { month: shiftMonth(month, -1) })}
                  className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-pill)] border border-[var(--color-line)] text-[var(--color-ink)] transition-colors hover:border-[var(--color-court)] hover:text-[var(--color-court)]"
                  aria-label="Previous month"
                >
                  ←
                </Link>
                <p className="whitespace-nowrap font-[family-name:var(--font-mono)] text-sm font-medium text-[var(--color-ink)]">
                  {monthLabel(month)}
                </p>
                <Link
                  href={buildHref(params, { month: shiftMonth(month, 1) })}
                  className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-pill)] border border-[var(--color-line)] text-[var(--color-ink)] transition-colors hover:border-[var(--color-court)] hover:text-[var(--color-court)]"
                  aria-label="Next month"
                >
                  →
                </Link>
              </div>
            </div>
            <p className="mt-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-ink-muted)]">
              Total: <span className="font-semibold text-[var(--color-ink)]">{formatTZS(receivedTotal)}</span>
            </p>
            <div className="mt-3">
              {!received || received.length === 0 ? (
                <EmptyState message="No payments received this month." />
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
                        <span className="text-sm font-medium text-[var(--color-court)]">
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
            <div className="flex h-9 items-center justify-between gap-3">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
                Paid
              </h2>
              <div className="flex shrink-0 items-center gap-3">
                <Link
                  href={buildHref(params, { month: shiftMonth(month, -1) })}
                  className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-pill)] border border-[var(--color-line)] text-[var(--color-ink)] transition-colors hover:border-[var(--color-court)] hover:text-[var(--color-court)]"
                  aria-label="Previous month"
                >
                  ←
                </Link>
                <p className="whitespace-nowrap font-[family-name:var(--font-mono)] text-sm font-medium text-[var(--color-ink)]">
                  {monthLabel(month)}
                </p>
                <Link
                  href={buildHref(params, { month: shiftMonth(month, 1) })}
                  className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-pill)] border border-[var(--color-line)] text-[var(--color-ink)] transition-colors hover:border-[var(--color-court)] hover:text-[var(--color-court)]"
                  aria-label="Next month"
                >
                  →
                </Link>
              </div>
            </div>
            <p className="mt-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-ink-muted)]">
              Total: <span className="font-semibold text-[var(--color-ink)]">{formatTZS(paidTotal)}</span>
            </p>
            <div className="mt-3">
              {!paid || paid.length === 0 ? (
                <EmptyState message="Nothing logged this month." />
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
