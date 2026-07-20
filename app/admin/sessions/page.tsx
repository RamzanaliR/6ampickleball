import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { EmptyState } from "@/components/empty-state";
import { SessionsBoard, type AdminSessionRow, type AdminSessionGroup } from "@/components/admin/sessions-board";

const statusFilters = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export default async function AdminSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusParam } = await searchParams;
  const status = statusFilters.some((f) => f.value === statusParam) ? statusParam : "all";

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

  let query = supabase
    .from("sessions")
    .select(
      "id, title, date_time, location, capacity, courts, status, counts_toward_leaderboard, dupr_eligible"
    )
    .order("date_time", { ascending: false });
  if (status && status !== "all") {
    query = query.eq("status", status);
  }
  const { data: sessions } = await query;

  const sessionIds = (sessions ?? []).map((s) => s.id);

  const { data: rsvps } = sessionIds.length
    ? await supabase
        .from("rsvps")
        .select("session_id, player_id, no_show")
        .in("session_id", sessionIds)
        .eq("status", "confirmed")
    : { data: [] as { session_id: string; player_id: string; no_show: boolean }[] };

  const playerIds = [...new Set((rsvps ?? []).map((r) => r.player_id))];
  const { data: playersData } = playerIds.length
    ? await supabase.from("players").select("id, is_guest").in("id", playerIds)
    : { data: [] as { id: string; is_guest: boolean }[] };
  const isGuestById = new Map((playersData ?? []).map((p) => [p.id, p.is_guest]));

  const { data: matchCounts } = sessionIds.length
    ? await supabase
        .from("matches")
        .select("session_id")
        .in("session_id", sessionIds)
        .eq("source", "fixture")
    : { data: [] as { session_id: string }[] };
  const sessionsWithFixtures = new Set((matchCounts ?? []).map((m) => m.session_id));

  const statsBySession = new Map<
    string,
    { confirmed: number; guests: number; noShows: number }
  >();
  for (const r of rsvps ?? []) {
    const entry = statsBySession.get(r.session_id) ?? { confirmed: 0, guests: 0, noShows: 0 };
    entry.confirmed += 1;
    if (isGuestById.get(r.player_id)) entry.guests += 1;
    if (r.no_show) entry.noShows += 1;
    statsBySession.set(r.session_id, entry);
  }

  const rows: AdminSessionRow[] = (sessions ?? []).map((s) => {
    const stats = statsBySession.get(s.id) ?? { confirmed: 0, guests: 0, noShows: 0 };
    return {
      id: s.id,
      title: s.title,
      dateTime: s.date_time,
      location: s.location,
      capacity: s.capacity,
      courts: s.courts,
      status: s.status,
      countsTowardLeaderboard: s.counts_toward_leaderboard,
      duprEligible: s.dupr_eligible,
      confirmedCount: stats.confirmed,
      guestCount: stats.guests,
      noShowCount: stats.noShows,
      hasFixtures: sessionsWithFixtures.has(s.id),
    };
  });

  // Group by month, newest first (rows already sorted by date_time desc).
  const groups: AdminSessionGroup[] = [];
  const groupIndexByLabel = new Map<string, number>();
  for (const row of rows) {
    const label = new Date(row.dateTime).toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
      timeZone: "Africa/Dar_es_Salaam",
    });
    if (!groupIndexByLabel.has(label)) {
      groupIndexByLabel.set(label, groups.length);
      groups.push({ label, sessions: [] });
    }
    groups[groupIndexByLabel.get(label)!].sessions.push(row);
  }

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Sessions" />
      <div className="mx-auto mt-8 max-w-6xl px-6 pb-16">
        <AdminTabs active="/admin/sessions" role={isAdmin ? "admin" : "manager"} />

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((f) => (
              <Link
                key={f.value}
                href={f.value === "all" ? "/admin/sessions" : `/admin/sessions?status=${f.value}`}
                className={
                  status === f.value
                    ? "rounded-[var(--radius-pill)] bg-[var(--color-court)] px-3 py-1.5 text-xs font-semibold text-white"
                    : "rounded-[var(--radius-pill)] border border-[var(--color-line)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink)] hover:border-[var(--color-court)] hover:text-[var(--color-court)]"
                }
              >
                {f.label}
              </Link>
            ))}
          </div>
          <Link
            href="/admin/sessions/new"
            className="rounded-[var(--radius-pill)] bg-[var(--color-court)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)]"
          >
            New session
          </Link>
        </div>

        <div className="mt-6">
          {groups.length === 0 ? (
            <EmptyState message="No sessions match this filter." />
          ) : (
            <SessionsBoard groups={groups} isAdmin={isAdmin} />
          )}
        </div>
      </div>
    </div>
  );
}
