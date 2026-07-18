import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "@/components/admin/print-button";
import { formatSessionDate, formatSessionTime, displayName } from "@/lib/format";

export default async function FixturesPrintPage({
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

  const { data: matchesData } = await supabase
    .from("matches")
    .select("id, team_a, team_b, round_number, court_number")
    .eq("session_id", id)
    .eq("source", "fixture")
    .order("round_number", { ascending: true })
    .order("court_number", { ascending: true });
  const matches = matchesData ?? [];

  const playerIds = [...new Set(matches.flatMap((m) => [...m.team_a, ...m.team_b]))];
  const { data: playersData } = playerIds.length
    ? await supabase.from("players").select("id, name, nickname").in("id", playerIds)
    : { data: [] as { id: string; name: string; nickname: string | null }[] };
  const nameById = new Map((playersData ?? []).map((p) => [p.id, displayName(p)]));
  const teamLabel = (ids: string[]) =>
    ids.map((pid) => nameById.get(pid) ?? "Unknown").join(" & ");

  const roundsMap = new Map<number, typeof matches>();
  for (const m of matches) {
    const r = m.round_number ?? 0;
    if (!roundsMap.has(r)) roundsMap.set(r, []);
    roundsMap.get(r)!.push(m);
  }
  const rounds = [...roundsMap.entries()].sort(([a], [b]) => a - b);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 print:px-0 print:py-0">
      <div className="mb-8 flex items-start justify-between print:mb-6">
        <div>
          <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[var(--color-court)]">
            6AM Pickleball Club
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
            {session.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            {formatSessionDate(session.date_time)} · {formatSessionTime(session.date_time)} ·{" "}
            {session.location}
          </p>
        </div>
        <PrintButton />
      </div>

      {rounds.length === 0 ? (
        <p className="text-sm text-[var(--color-ink-muted)]">No fixtures generated yet.</p>
      ) : (
        <div className="space-y-6">
          {rounds.map(([roundNumber, roundMatches]) => (
            <div key={roundNumber} className="break-inside-avoid">
              <p className="mb-2 font-[family-name:var(--font-mono)] text-sm font-semibold uppercase tracking-widest text-[var(--color-ink)]">
                Round {roundNumber}
              </p>
              <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] print:rounded-none">
                {(roundMatches as typeof matches).map((m, i) => (
                  <div
                    key={m.id}
                    className={`flex items-center gap-4 px-4 py-2.5 ${
                      i !== roundMatches.length - 1 ? "border-b border-[var(--color-line)]" : ""
                    }`}
                  >
                    <span className="w-16 shrink-0 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">
                      Court {m.court_number}
                    </span>
                    <span className="text-sm text-[var(--color-ink)]">
                      <span className="font-medium">{teamLabel(m.team_a)}</span>
                      <span className="mx-2 text-[var(--color-ink-muted)]">vs</span>
                      <span className="font-medium">{teamLabel(m.team_b)}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
