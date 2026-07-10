import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export default async function TournamentsPage() {
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

  if (player?.status !== "approved") {
    return (
      <div>
        <PageHeader eyebrow="Round robin" title="Tournaments" />
        <div className="mx-auto mt-8 max-w-3xl px-6 pb-16">
          <EmptyState message="Your account needs admin approval first." />
        </div>
      </div>
    );
  }

  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("id, name, start_date, end_date")
    .order("start_date", { ascending: false });

  return (
    <div>
      <PageHeader
        eyebrow="Round robin"
        title="Tournaments"
        subtitle="Doesn't affect the season leaderboard — a separate cumulative standings for each event."
      />
      <div className="mx-auto mt-8 max-w-3xl px-6 pb-16">
        {!tournaments || tournaments.length === 0 ? (
          <EmptyState message="No tournaments yet." />
        ) : (
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)]">
            {tournaments.map((t, i) => (
              <Link
                key={t.id}
                href={`/tournaments/${t.id}`}
                className={`flex items-center justify-between px-6 py-4 transition-colors hover:bg-[var(--color-paper)] ${
                  i !== tournaments.length - 1 ? "kitchen-line" : ""
                }`}
              >
                <p className="font-medium text-[var(--color-ink)]">{t.name}</p>
                <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-ink-muted)]">
                  {t.start_date} → {t.end_date}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
