import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { formatSessionDate } from "@/lib/format";
import type { FeedMediaItem } from "@/lib/types";

export const metadata: Metadata = {
  title: "Highlights — 6AM Pickleball Club",
  description: "Leaderboard, standout players, and recent moments from the 6AM Pickleball Club.",
  openGraph: {
    title: "6AM Pickleball Club — Highlights",
    description: "Leaderboard, standout players, and recent moments from the club.",
    images: ["/icons/icon-512.png"],
  },
};

type MatchResultRow = { nickname: string; played_at: string; round_number: number; won: boolean };

function computeWinStreak(rows: MatchResultRow[]): { nickname: string; streak: number } | null {
  const byPlayer = new Map<string, MatchResultRow[]>();
  for (const row of rows) {
    const list = byPlayer.get(row.nickname) ?? [];
    list.push(row);
    byPlayer.set(row.nickname, list);
  }

  let best: { nickname: string; streak: number } | null = null;
  for (const [nickname, matches] of byPlayer) {
    // rows arrive newest-first; walk forward (i.e. from most recent
    // backwards in time) counting consecutive wins until the first loss.
    const sorted = [...matches].sort(
      (a, b) =>
        new Date(b.played_at).getTime() - new Date(a.played_at).getTime() ||
        b.round_number - a.round_number
    );
    let streak = 0;
    for (const m of sorted) {
      if (m.won) streak += 1;
      else break;
    }
    if (streak > 0 && (!best || streak > best.streak)) {
      best = { nickname, streak };
    }
  }
  return best;
}

export default async function HighlightsPage() {
  const supabase = await createClient();

  const [leaderboardResult, mostActiveResult, topWinRateResult, matchResultsResult, feedResult] =
    await Promise.all([
      supabase.rpc("club_public_leaderboard"),
      supabase.rpc("club_public_most_active_this_month"),
      supabase.rpc("club_public_top_win_rate"),
      supabase.rpc("club_public_match_results"),
      supabase
        .from("community_feed")
        .select("id, content, media, image_url, created_at")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(9),
    ]);

  const leaderboard =
    (leaderboardResult.data as { nickname: string; points: number; wins: number; losses: number }[]) ?? [];
  const mostActive = (mostActiveResult.data?.[0] as { nickname: string; sessions_count: number }) ?? null;
  const topWinRate =
    (topWinRateResult.data?.[0] as { nickname: string; wins: number; losses: number; win_rate: number }) ??
    null;
  const winStreak = computeWinStreak((matchResultsResult.data as MatchResultRow[]) ?? []);

  const posts = (feedResult.data ?? [])
    .map((post) => {
      const media: FeedMediaItem[] =
        Array.isArray(post.media) && post.media.length > 0
          ? (post.media as FeedMediaItem[])
          : post.image_url
            ? [{ url: post.image_url, type: "image" as const }]
            : [];
      return { id: post.id, content: post.content, media, createdAtLabel: formatSessionDate(post.created_at) };
    })
    .filter((p) => p.media.length > 0);

  const hasStandouts = mostActive || topWinRate || winStreak;

  return (
    <div>
      <section className="border-b border-[var(--color-line)] bg-[var(--color-paper-raised)]">
        <div className="mx-auto max-w-6xl px-6 py-14 text-center sm:py-20">
          <p className="font-[family-name:var(--font-mono)] text-sm uppercase tracking-widest text-[var(--color-court)]">
            6AM Pickleball Club
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold uppercase tracking-tight text-[var(--color-ink)] sm:text-5xl">
            Club Highlights
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[var(--color-ink-muted)]">
            Who&apos;s winning, who&apos;s showing up, and what&apos;s been happening on court.
          </p>
          <Link
            href="/signup"
            className="mt-6 inline-block rounded-[var(--radius-pill)] bg-[var(--color-court)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)]"
          >
            Request to join
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
          Leaderboard
        </h2>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">Top 10 by points this season.</p>

        {leaderboard.length === 0 ? (
          <p className="mt-6 text-sm text-[var(--color-ink-muted)]">No standings yet — check back soon.</p>
        ) : (
          <div className="mt-6 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)]">
            {leaderboard.map((row, i) => (
              <div
                key={row.nickname + i}
                className={`flex items-center justify-between px-5 py-3 ${
                  i !== leaderboard.length - 1 ? "kitchen-line" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-ink-muted)]">
                    {i + 1}
                  </span>
                  <span className="font-medium text-[var(--color-ink)]">{row.nickname}</span>
                </div>
                <div className="flex items-center gap-4 font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink-muted)]">
                  <span>{row.wins}W–{row.losses}L</span>
                  <span className="font-semibold text-[var(--color-court)]">{row.points} pts</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {hasStandouts && (
        <section className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
            Standout players
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {winStreak && (
              <StandoutCard
                label="Win streak"
                name={winStreak.nickname}
                value={`${winStreak.streak} in a row`}
              />
            )}
            {topWinRate && (
              <StandoutCard label="Top win rate" name={topWinRate.nickname} value={`${topWinRate.win_rate}%`} />
            )}
            {mostActive && (
              <StandoutCard
                label="Most active this month"
                name={mostActive.nickname}
                value={`${mostActive.sessions_count} sessions`}
              />
            )}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
          From the club
        </h2>
        {posts.length === 0 ? (
          <p className="mt-6 text-sm text-[var(--color-ink-muted)]">
            Nothing to show yet — check back after the next session.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)]"
              >
                <div className="aspect-video w-full bg-[var(--color-paper)]">
                  {post.media[0].type === "video" ? (
                    // eslint-disable-next-line jsx-a11y/media-has-caption
                    <video src={post.media[0].url} className="h-full w-full object-cover" muted />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.media[0].url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="p-3">
                  <p className="line-clamp-2 text-xs text-[var(--color-ink)]">{post.content}</p>
                  <p className="mt-1.5 font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-widest text-[var(--color-ink-muted)]">
                    {post.createdAtLabel}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-[var(--color-line)] bg-[var(--color-paper-raised)]">
        <div className="mx-auto max-w-6xl px-6 py-14 text-center">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
            Come play with us
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-ink-muted)]">
            Sessions run early, most days of the week. All levels welcome.
          </p>
          <Link
            href="/signup"
            className="mt-6 inline-block rounded-[var(--radius-pill)] bg-[var(--color-court)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)]"
          >
            Request to join
          </Link>
        </div>
      </section>
    </div>
  );
}

function StandoutCard({ label, name, value }: { label: string; name: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6 text-center">
      <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[var(--color-ink-muted)]">
        {label}
      </p>
      <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
        {name}
      </p>
      <p className="mt-1 text-sm font-semibold text-[var(--color-court)]">{value}</p>
    </div>
  );
}
