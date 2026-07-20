import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { EmptyState } from "@/components/empty-state";
import { NoShowToggle } from "@/components/admin/no-show-toggle";
import { displayName, formatSessionDate, formatSessionTime } from "@/lib/format";

export default async function SessionNoShowsPage({
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

  if (me?.role !== "admin" && me?.role !== "manager") redirect("/dashboard");

  const { data: session } = await supabase
    .from("sessions")
    .select("id, title, date_time, location")
    .eq("id", id)
    .single();

  if (!session) notFound();

  const { data: rsvps } = await supabase
    .from("rsvps")
    .select("player_id, no_show")
    .eq("session_id", id)
    .eq("status", "confirmed");

  const playerIds = (rsvps ?? []).map((r) => r.player_id);
  const { data: playersData } = playerIds.length
    ? await supabase.from("players").select("id, name, nickname").in("id", playerIds)
    : { data: [] as { id: string; name: string; nickname: string | null }[] };
  const nameById = new Map((playersData ?? []).map((p) => [p.id, displayName(p)]));

  const sorted = [...(rsvps ?? [])].sort((a, b) =>
    (nameById.get(a.player_id) ?? "").localeCompare(nameById.get(b.player_id) ?? "")
  );

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title={`No-shows — ${session.title}`}
        subtitle={`${formatSessionDate(session.date_time)} · ${formatSessionTime(session.date_time)} · ${session.location} — everyone confirmed is assumed to have shown up; flag anyone who didn't.`}
      />
      <div className="mx-auto mt-8 max-w-6xl px-6 pb-16">
        <AdminTabs active="/admin/sessions" role={me?.role === "manager" ? "manager" : "admin"} />
        <div className="mt-6">
          {sorted.length === 0 ? (
            <EmptyState message="No one confirmed for this session." />
          ) : (
            <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)]">
              {sorted.map((r, i) => (
                <div
                  key={r.player_id}
                  className={`flex items-center justify-between px-6 py-3 ${
                    i !== sorted.length - 1 ? "kitchen-line" : ""
                  } ${r.no_show ? "bg-[var(--color-danger-bg)]" : ""}`}
                >
                  <p
                    className={
                      r.no_show
                        ? "font-medium text-[var(--color-danger)]"
                        : "font-medium text-[var(--color-ink)]"
                    }
                  >
                    {nameById.get(r.player_id) ?? "Unknown"}
                  </p>
                  <NoShowToggle sessionId={session.id} playerId={r.player_id} initialChecked={r.no_show} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
