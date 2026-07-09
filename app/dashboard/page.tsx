import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: player } = await supabase
    .from("players")
    .select("name, status, skill_tier, points, wins, losses")
    .eq("id", user.id)
    .single();

  if (player?.status === "pending") {
    return (
      <div>
        <PageHeader eyebrow="Your dashboard" title="Almost on the roster" />
        <div className="mx-auto mt-8 max-w-6xl px-6">
          <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6">
            <p className="text-[var(--color-ink)]">
              Your account is waiting on admin approval. You&apos;ll be able to
              RSVP to sessions and see the leaderboard once that&apos;s done.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Your dashboard"
        title={`Hey, ${player?.name?.split(" ")[0] ?? "there"}`}
        subtitle="Profile, upcoming sessions, and match history land here in Phase 2."
      />
      <div className="mx-auto mt-8 grid max-w-6xl gap-4 px-6 pb-16 md:grid-cols-3">
        <StatCard label="Points" value={player?.points ?? 0} />
        <StatCard label="Wins" value={player?.wins ?? 0} />
        <StatCard label="Losses" value={player?.losses ?? 0} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6">
      <p className="text-xs uppercase tracking-widest text-[var(--color-ink-muted)]">
        {label}
      </p>
      <p className="mt-1 font-[family-name:var(--font-mono)] text-4xl font-semibold text-[var(--color-ink)]">
        {value}
      </p>
    </div>
  );
}
