import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { LeaderboardTable } from "@/components/leaderboard-table";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: players } = await supabase
    .from("players")
    .select("name, points, wins, losses, skill_tier")
    .eq("status", "approved")
    .eq("is_guest", false)
    .order("points", { ascending: false });

  return (
    <div>
      <PageHeader
        eyebrow="Standings"
        title="Leaderboard"
        subtitle="A win is worth 2 points, a loss 0 — updated as soon as an admin verifies a result."
      />
      <div className="mx-auto mt-8 max-w-6xl px-6 pb-16">
        {!players || players.length === 0 ? (
          <EmptyState message="No approved players yet." />
        ) : (
          <LeaderboardTable players={players} />
        )}
      </div>
    </div>
  );
}
