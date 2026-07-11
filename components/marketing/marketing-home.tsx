import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatSessionDate } from "@/lib/format";
import type { FeedMediaItem } from "@/lib/types";

export async function MarketingHome() {
  const supabase = await createClient();

  const [{ data: events }, statsResult] = await Promise.all([
    supabase
      .from("community_feed")
      .select("id, content, media, image_url, created_at")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase.rpc("club_public_stats").single(),
  ]);
  const stats = statsResult.data as
    | { members: number; sessions_hosted: number; matches_played: number }
    | null;

  const eventCards = (events ?? [])
    .map((post) => {
      const media: FeedMediaItem[] =
        Array.isArray(post.media) && post.media.length > 0
          ? (post.media as FeedMediaItem[])
          : post.image_url
            ? [{ url: post.image_url, type: "image" as const }]
            : [];
      return { id: post.id, content: post.content, media, createdAtLabel: formatSessionDate(post.created_at) };
    })
    .filter((e) => e.media.length > 0);

  return (
    <div>
      {/* Hero — full-bleed layout (Option A) with the real club photo.
          To swap the photo later: replace /public/hero.jpg (keep the
          same filename), or update the url() below. */}
      <section
        className="relative flex min-h-[520px] items-end overflow-hidden md:min-h-[640px]"
        style={{
          background: "url('/hero.jpg') center/cover no-repeat",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(0deg, color-mix(in srgb, var(--color-court-dark) 92%, black) 0%, color-mix(in srgb, var(--color-court-dark) 75%, transparent) 45%, transparent 85%)",
          }}
        />
        <div className="relative mx-auto w-full max-w-6xl px-6 pb-16 pt-32">
          <p className="font-[family-name:var(--font-mono)] text-sm uppercase tracking-widest text-[var(--color-ball)]">
            6AM Pickleball Club • Dar es Salaam
          </p>
          <h1 className="mt-4 max-w-2xl font-[family-name:var(--font-display)] text-4xl font-extrabold uppercase leading-[1.05] tracking-tight text-white md:text-6xl">
            When the courts opens
            <br />
            before the city wake up
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/80">
            A Dar es Salaam pickleball family that starts the day together —
            early mornings, good rallies, and friendships that outlast the
            session.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/signup"
              className="rounded-[var(--radius-pill)] bg-[var(--color-court)] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)]"
            >
              Request to join
            </Link>
            <Link
              href="#events"
              className="rounded-[var(--radius-pill)] border border-white/40 px-6 py-3 text-base font-medium text-white transition-colors hover:border-white hover:bg-white/10"
            >
              See what we&apos;re about
            </Link>
          </div>
        </div>
      </section>

      {/* Row 1: Welcome (left) / Chairperson message (right) */}
      <section className="kitchen-line border-t-0 bg-[var(--color-paper-raised)]">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:gap-8">
          <div id="about" className="scroll-mt-24">
            <p className="font-[family-name:var(--font-mono)] text-sm uppercase tracking-widest text-[var(--color-court)]">
              Welcome
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
              A 6AM club, but the friendships run all day
            </h2>
            <p className="mt-4 text-[var(--color-ink-muted)]">
              {/* Placeholder — swap in the real welcome copy whenever you're ready. */}
              We&apos;re a Dar es Salaam pickleball community that meets early,
              plays hard, and keeps things social. Whether you&apos;ve been on
              a court before or this is your first paddle, there&apos;s a spot
              for you on ours.
            </p>
          </div>

          <div id="chairperson" className="scroll-mt-24 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-6">
            <div className="flex items-center gap-4">
              <Image
                src="/chairperson-amin-ladha.jpg"
                alt="Amin Ladha"
                width={56}
                height={56}
                className="h-14 w-14 shrink-0 rounded-full object-cover"
              />
              <div>
                <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[var(--color-court)]">
                  A word from our chairperson
                </p>
                <p className="font-semibold text-[var(--color-ink)]">Amin Ladha</p>
              </div>
            </div>
            {/* Placeholder quote — replace with the real message. */}
            <p className="mt-4 italic leading-relaxed text-[var(--color-ink)]">
              &ldquo;This club started as a handful of us on one court at
              sunrise. What keeps it going is simple — show up, play fair,
              and look out for each other on and off the court.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* Row 2: Events / gallery (left, auto-pulled from The Club) /
          By the numbers (right) */}
      <section>
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:gap-8">
          <div id="events" className="scroll-mt-24">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
              From the club
            </h2>
            <p className="mt-2 text-[var(--color-ink-muted)]">
              Highlights from recent sessions and get-togethers.
            </p>

            {eventCards.length === 0 ? (
              <p className="mt-8 text-sm text-[var(--color-ink-muted)]">
                Nothing to show yet — check back after the next session.
              </p>
            ) : (
              <div className="mt-6 grid grid-cols-2 gap-3">
                {eventCards.map((event) => (
                  <div
                    key={event.id}
                    className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)]"
                  >
                    <div className="aspect-video w-full bg-[var(--color-paper)]">
                      {event.media[0].type === "video" ? (
                        // eslint-disable-next-line jsx-a11y/media-has-caption
                        <video src={event.media[0].url} className="h-full w-full object-cover" muted />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={event.media[0].url} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-2 text-xs text-[var(--color-ink)]">{event.content}</p>
                      <p className="mt-1.5 font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-widest text-[var(--color-ink-muted)]">
                        {event.createdAtLabel}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div id="stats" className="scroll-mt-24">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
              By the numbers
            </h2>
            <div className="mt-6 grid grid-cols-3 divide-x divide-[var(--color-line)] rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)]">
              <StatBlock label="Members" value={stats?.members ?? 0} />
              <StatBlock label="Sessions run" value={stats?.sessions_hosted ?? 0} />
              <StatBlock label="Matches played" value={stats?.matches_played ?? 0} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-3 py-6 text-center">
      <p className="font-[family-name:var(--font-mono)] text-3xl font-semibold text-[var(--color-ink)]">
        {value}
      </p>
      <p className="mt-1 text-[10px] uppercase tracking-widest text-[var(--color-ink-muted)]">
        {label}
      </p>
    </div>
  );
}
