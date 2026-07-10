import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { EmptyState } from "@/components/empty-state";
import { PaymentStatusToggle } from "@/components/admin/payment-status-toggle";
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

  let query = supabase
    .from("payments")
    .select("id, player_id, session_id, period, amount, type, status")
    .order("created_at", { ascending: false });

  if (params.player) query = query.eq("player_id", params.player);
  if (params.session) query = query.eq("session_id", params.session);
  if (params.status) query = query.eq("status", params.status);
  if (params.period) query = query.ilike("period", `%${params.period}%`);

  const [{ data: payments }, { data: players }, { data: sessions }] = await Promise.all([
    query,
    supabase.from("players").select("id, name").eq("status", "approved").eq("is_guest", false).order("name"),
    supabase.from("sessions").select("id, title").order("date_time", { ascending: false }),
  ]);

  const nameById = new Map((players ?? []).map((p) => [p.id, p.name]));
  const sessionTitleById = new Map((sessions ?? []).map((s) => [s.id, s.title]));
  const hasFilters = Boolean(params.player || params.session || params.status || params.period);

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Payments" />
      <div className="mx-auto mt-8 max-w-6xl px-6 pb-16">
        <AdminTabs active="/admin/payments" />

        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <form
            method="get"
            className="flex flex-wrap items-center gap-3"
          >
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
          <Link
            href="/admin/payments/new"
            className="rounded-[var(--radius-pill)] bg-[var(--color-court)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)]"
          >
            Add charge
          </Link>
        </div>

        <div className="mt-6">
          {!payments || payments.length === 0 ? (
            <EmptyState message="No payments match these filters." />
          ) : (
            <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)]">
              {payments.map((p, i) => (
                <div
                  key={p.id}
                  className={`flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between ${
                    i !== payments.length - 1 ? "kitchen-line" : ""
                  }`}
                >
                  <div>
                    <p className="font-medium text-[var(--color-ink)]">
                      {nameById.get(p.player_id) ?? "Unknown"}
                    </p>
                    <p className="text-sm text-[var(--color-ink-muted)]">
                      {p.type === "session_fee"
                        ? (sessionTitleById.get(p.session_id ?? "") ?? "Session fee")
                        : `Membership · ${p.period}`}{" "}
                      · {formatTZS(p.amount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
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
      </div>
    </div>
  );
}
