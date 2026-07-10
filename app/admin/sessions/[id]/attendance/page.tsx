import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { EmptyState } from "@/components/empty-state";
import { AttendanceCheckbox } from "@/components/admin/attendance-checkbox";
import { formatSessionDate, formatSessionTime } from "@/lib/format";

export default async function SessionAttendancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data: session } = await supabase
    .from("sessions")
    .select("id, title, date_time, location")
    .eq("id", id)
    .single();

  if (!session) notFound();

  const [{ data: roster }, { data: rsvps }, { data: attendance }] = await Promise.all([
    supabase
      .from("players")
      .select("id, name")
      .eq("status", "approved")
      .eq("is_guest", false)
      .order("name"),
    supabase.from("rsvps").select("player_id").eq("session_id", id).eq("status", "confirmed"),
    supabase.from("attendance").select("player_id").eq("session_id", id),
  ]);

  const confirmedIds = new Set((rsvps ?? []).map((r) => r.player_id));
  const attendedIds = new Set((attendance ?? []).map((a) => a.player_id));

  // Guests only ever show up for the specific session they were added to,
  // not the general roster — pull in anyone confirmed here who isn't
  // already a regular approved member.
  const rosterIds = new Set((roster ?? []).map((p) => p.id));
  const missingGuestIds = [...confirmedIds].filter((pid) => !rosterIds.has(pid));
  const { data: sessionGuests } = missingGuestIds.length
    ? await supabase.from("players").select("id, name").in("id", missingGuestIds)
    : { data: [] as { id: string; name: string }[] };

  const combined = [...(roster ?? []), ...(sessionGuests ?? [])];

  const sorted = [...combined].sort((a, b) => {
    const aRank = confirmedIds.has(a.id) ? 0 : 1;
    const bRank = confirmedIds.has(b.id) ? 0 : 1;
    if (aRank !== bRank) return aRank - bRank;
    return a.name.localeCompare(b.name);
  });

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title={`Attendance — ${session.title}`}
        subtitle={`${formatSessionDate(session.date_time)} · ${formatSessionTime(session.date_time)} · ${session.location}`}
      />
      <div className="mx-auto mt-8 max-w-6xl px-6 pb-16">
        <AdminTabs active="/admin/sessions" />
        <div className="mt-6">
          {sorted.length === 0 ? (
            <EmptyState message="No approved players yet." />
          ) : (
            <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)]">
              {sorted.map((p, i) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between px-6 py-3 ${
                    i !== sorted.length - 1 ? "kitchen-line" : ""
                  }`}
                >
                  <div>
                    <p className="font-medium text-[var(--color-ink)]">{p.name}</p>
                    {confirmedIds.has(p.id) && (
                      <p className="text-xs text-[var(--color-court)]">I&apos;m in</p>
                    )}
                  </div>
                  <AttendanceCheckbox
                    sessionId={session.id}
                    playerId={p.id}
                    initialChecked={attendedIds.has(p.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
