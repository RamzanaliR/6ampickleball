import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { SessionForm } from "@/components/admin/session-form";
import { updateSession } from "@/lib/actions/admin-sessions";
import { toDarDateInputValue, toDarTimeInputValue } from "@/lib/format";

export default async function EditSessionPage({
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

  const [{ data: session }, { data: tournaments }] = await Promise.all([
    supabase
      .from("sessions")
      .select(
        "id, title, date_time, location, capacity, courts, counts_toward_leaderboard, dupr_eligible, tournament_id"
      )
      .eq("id", id)
      .single(),
    supabase.from("tournaments").select("id, name").order("start_date", { ascending: false }),
  ]);

  if (!session) notFound();

  const boundUpdate = updateSession.bind(null, session.id);

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Edit session" />
      <div className="mx-auto mt-8 max-w-6xl px-6 pb-16">
        <AdminTabs active="/admin/sessions" role={me?.role === "manager" ? "manager" : "admin"} />
        <div className="mt-6 max-w-lg rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6">
          <SessionForm
            action={boundUpdate}
            submitLabel="Save changes"
            tournaments={tournaments ?? []}
            defaultValues={{
              title: session.title,
              date: toDarDateInputValue(session.date_time),
              time: toDarTimeInputValue(session.date_time),
              location: session.location,
              capacity: session.capacity,
              courts: session.courts,
              countsTowardLeaderboard: session.counts_toward_leaderboard,
              duprEligible: session.dupr_eligible,
              tournamentId: session.tournament_id,
            }}
          />
        </div>
      </div>
    </div>
  );
}
