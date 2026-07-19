import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { SessionForm } from "@/components/admin/session-form";
import { createSession } from "@/lib/actions/admin-sessions";

export default async function NewSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ tournament?: string }>;
}) {
  const { tournament } = await searchParams;
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

  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("id, name")
    .order("start_date", { ascending: false });

  return (
    <div>
      <PageHeader eyebrow="Admin" title="New session" />
      <div className="mx-auto mt-8 max-w-6xl px-6 pb-16">
        <AdminTabs active="/admin/sessions" />
        <div className="mt-6 max-w-lg rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6">
          <SessionForm
            action={createSession}
            submitLabel="Create session"
            tournaments={tournaments ?? []}
            defaultValues={
              tournament
                ? {
                    title: "",
                    date: "",
                    time: "",
                    location: "",
                    capacity: 24,
                    courts: null,
                    countsTowardLeaderboard: false,
                    duprEligible: false,
                    tournamentId: tournament,
                  }
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}
