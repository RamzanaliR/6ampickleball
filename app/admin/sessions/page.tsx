import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { EmptyState } from "@/components/empty-state";
import { SessionQuickActions } from "@/components/admin/session-quick-actions";
import { SessionDeleteButton } from "@/components/admin/session-delete-button";
import { formatSessionDate, formatSessionTime } from "@/lib/format";

const statusStyles: Record<string, string> = {
  upcoming: "text-[var(--color-court)]",
  completed: "text-[var(--color-ink-muted)]",
  cancelled: "text-[var(--color-danger)]",
};

export default async function AdminSessionsPage() {
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

  const { data: sessions } = await supabase
    .from("sessions")
    .select(
      "id, title, date_time, location, capacity, courts, status, counts_toward_leaderboard, dupr_eligible"
    )
    .order("date_time", { ascending: false });

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Sessions" />
      <div className="mx-auto mt-8 max-w-6xl px-6 pb-16">
        <AdminTabs active="/admin/sessions" />

        <div className="mt-6 flex justify-end">
          <Link
            href="/admin/sessions/new"
            className="rounded-[var(--radius-pill)] bg-[var(--color-court)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)]"
          >
            New session
          </Link>
        </div>

        <div className="mt-4">
          {!sessions || sessions.length === 0 ? (
            <EmptyState message="No sessions yet — create the first one." />
          ) : (
            <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)]">
              {sessions.map((s, i) => (
                <div
                  key={s.id}
                  className={`flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between ${
                    i !== sessions.length - 1 ? "kitchen-line" : ""
                  }`}
                >
                  <div>
                    <p className="font-medium text-[var(--color-ink)]">{s.title}</p>
                    <p className="text-sm text-[var(--color-ink-muted)]">
                      {formatSessionDate(s.date_time)} · {formatSessionTime(s.date_time)} ·{" "}
                      {s.location} · cap {s.capacity}
                      {s.courts ? ` · ${s.courts} courts` : ""}
                    </p>
                    {(!s.counts_toward_leaderboard || s.dupr_eligible) && (
                      <p className="mt-1 flex gap-2">
                        {!s.counts_toward_leaderboard && (
                          <span className="rounded-[var(--radius-pill)] border border-[var(--color-line)] px-2 py-0.5 text-xs text-[var(--color-ink-muted)]">
                            Not on leaderboard
                          </span>
                        )}
                        {s.dupr_eligible && (
                          <span className="rounded-[var(--radius-pill)] border border-[var(--color-line)] px-2 py-0.5 text-xs text-[var(--color-ink-muted)]">
                            DUPR
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <span
                      className={`font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest ${statusStyles[s.status]}`}
                    >
                      {s.status}
                    </span>
                    <Link
                      href={`/admin/sessions/${s.id}/fixtures`}
                      className="text-sm font-medium text-[var(--color-ink)] hover:text-[var(--color-court)]"
                    >
                      Fixtures
                    </Link>
                    <Link
                      href={`/admin/sessions/${s.id}/no-shows`}
                      className="text-sm font-medium text-[var(--color-ink)] hover:text-[var(--color-court)]"
                    >
                      No-shows
                    </Link>
                    <Link
                      href={`/admin/sessions/${s.id}/edit`}
                      className="text-sm font-medium text-[var(--color-ink)] hover:text-[var(--color-court)]"
                    >
                      Edit
                    </Link>
                    <SessionQuickActions sessionId={s.id} status={s.status} />
                    <SessionDeleteButton sessionId={s.id} />
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
