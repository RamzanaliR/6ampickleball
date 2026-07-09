import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ProfileForm } from "@/components/profile-form";
import { formatSessionDate, formatSessionTime } from "@/lib/format";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: player } = await supabase
    .from("players")
    .select("name, phone, status, skill_tier, points, wins, losses")
    .eq("id", user.id)
    .single();

  if (player?.status === "pending") {
    return (
      <div>
        <PageHeader eyebrow="Your dashboard" title="Almost on the roster" />
        <div className="mx-auto mt-8 max-w-6xl px-6 pb-16">
          <EmptyState message="Your account is waiting on admin approval. You'll be able to RSVP to sessions and see the leaderboard once that's done." />
        </div>
      </div>
    );
  }

  const { data: myRsvps } = await supabase
    .from("rsvps")
    .select("status, sessions!inner(id, title, date_time, location, status)")
    .eq("player_id", user.id)
    .in("status", ["confirmed", "waitlisted"])
    .eq("sessions.status", "upcoming")
    .order("date_time", { referencedTable: "sessions", ascending: true });

  return (
    <div>
      <PageHeader
        eyebrow="Your dashboard"
        title={`Hey, ${player?.name?.split(" ")[0] ?? "there"}`}
      />
      <div className="mx-auto mt-8 max-w-6xl px-6 pb-16">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Points" value={player?.points ?? 0} />
          <StatCard label="Wins" value={player?.wins ?? 0} />
          <StatCard label="Losses" value={player?.losses ?? 0} />
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <section>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
              Profile
            </h2>
            <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6">
              <ProfileForm
                name={player?.name ?? ""}
                phone={player?.phone ?? null}
                skillTier={player?.skill_tier ?? null}
              />
            </div>
          </section>

          <div className="space-y-8">
            <section>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
                Your upcoming sessions
              </h2>
              <div className="mt-4">
                {!myRsvps || myRsvps.length === 0 ? (
                  <EmptyState message="No RSVPs yet — head to Sessions to grab a spot." />
                ) : (
                  <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)]">
                    {myRsvps.map((r, i) => {
                      const session = Array.isArray(r.sessions) ? r.sessions[0] : r.sessions;
                      if (!session) return null;
                      return (
                        <div
                          key={session.id}
                          className={`flex items-center justify-between px-5 py-4 ${
                            i !== myRsvps.length - 1 ? "kitchen-line" : ""
                          }`}
                        >
                          <div>
                            <p className="font-medium text-[var(--color-ink)]">{session.title}</p>
                            <p className="text-sm text-[var(--color-ink-muted)]">
                              {formatSessionDate(session.date_time)} ·{" "}
                              {formatSessionTime(session.date_time)}
                            </p>
                          </div>
                          {r.status === "waitlisted" && (
                            <span className="shrink-0 rounded-[var(--radius-pill)] border border-[var(--color-ball)] bg-[var(--color-ball)]/30 px-3 py-1 text-xs font-semibold text-[var(--color-ink)]">
                              Waitlisted
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            <section>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
                Match history
              </h2>
              <div className="mt-4">
                <EmptyState message="Match submission and results land in Phase 4." />
              </div>
            </section>
          </div>
        </div>
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
