import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { EmptyState } from "@/components/empty-state";
import { MatchVerificationRow } from "@/components/admin/match-verification-row";
import { formatSessionDate } from "@/lib/format";
import type { MatchSet } from "@/lib/types";

export default async function AdminMatchesPage() {
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

  const { data: matches } = await supabase
    .from("matches")
    .select("id, session_id, team_a, team_b, sets, winning_team, submitted_by, created_at")
    .eq("verified", false)
    .eq("source", "manual")
    .order("created_at", { ascending: true });

  const sessionIds = [...new Set((matches ?? []).map((m) => m.session_id))];
  const playerIds = [
    ...new Set(
      (matches ?? []).flatMap((m) => [...m.team_a, ...m.team_b, m.submitted_by])
    ),
  ];

  const [{ data: sessions }, { data: players }] = await Promise.all([
    sessionIds.length
      ? supabase.from("sessions").select("id, title, date_time").in("id", sessionIds)
      : Promise.resolve({ data: [] as { id: string; title: string; date_time: string }[] }),
    playerIds.length
      ? supabase.from("players").select("id, name").in("id", playerIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  const sessionById = new Map((sessions ?? []).map((s) => [s.id, s]));
  const nameById = new Map((players ?? []).map((p) => [p.id, p.name]));
  const teamLabel = (ids: string[]) =>
    ids.map((id) => nameById.get(id) ?? "Unknown").join(" & ");
  const setsLabel = (sets: MatchSet[]) =>
    sets.map((s) => `${s.a}-${s.b}`).join(", ");

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Matches" />
      <div className="mx-auto mt-8 max-w-6xl px-6 pb-16">
        <AdminTabs active="/admin/matches" />

        <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] px-6">
          {!matches || matches.length === 0 ? (
            <div className="py-10">
              <EmptyState message="No results waiting on verification." />
            </div>
          ) : (
            matches.map((m) => {
              const session = sessionById.get(m.session_id);
              return (
                <MatchVerificationRow
                  key={m.id}
                  matchId={m.id}
                  sessionTitle={session?.title ?? "Unknown session"}
                  sessionDate={session ? formatSessionDate(session.date_time) : ""}
                  teamALabel={teamLabel(m.team_a)}
                  teamBLabel={teamLabel(m.team_b)}
                  setsLabel={setsLabel(m.sets as MatchSet[])}
                  winningTeam={m.winning_team}
                  submittedByName={nameById.get(m.submitted_by) ?? "Unknown"}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
