import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { MatchForm } from "@/components/match-form";
import { submitMatch } from "@/lib/actions/matches";

export default async function LogMatchPage({
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

  const { data: player } = await supabase
    .from("players")
    .select("status")
    .eq("id", user.id)
    .single();

  if (player?.status !== "approved") redirect("/dashboard");

  const { data: session } = await supabase
    .from("sessions")
    .select("id, title, date_time, status")
    .eq("id", id)
    .single();

  if (!session) notFound();

  const { data: roster } = await supabase
    .from("players")
    .select("id, name")
    .eq("status", "approved")
    .order("name", { ascending: true });

  const boundSubmit = submitMatch.bind(null, session.id);

  return (
    <div>
      <PageHeader eyebrow="Log a result" title={session.title} />
      <div className="mx-auto mt-8 max-w-2xl px-6 pb-16">
        {session.status !== "completed" ? (
          <EmptyState message="Results can be logged once this session is marked completed." />
        ) : (
          <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6">
            <MatchForm
              action={boundSubmit}
              players={roster ?? []}
              currentPlayerId={user.id}
            />
          </div>
        )}
      </div>
    </div>
  );
}
