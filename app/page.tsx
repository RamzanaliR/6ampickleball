import Link from "next/link";

const steps = [
  {
    label: "Sign up",
    body: "Create an account. An admin reviews and approves new members before you're on the roster.",
  },
  {
    label: "RSVP",
    body: "See upcoming sessions, RSVP, and get bumped off the waitlist automatically as spots open.",
  },
  {
    label: "Play & log",
    body: "Submit your results after a session. Once verified, your points update.",
  },
  {
    label: "Climb",
    body: "Track wins, losses, and standing on the leaderboard.",
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 md:pt-24">
        <p className="font-[family-name:var(--font-mono)] text-sm uppercase tracking-widest text-[var(--color-court)]">
          Dar es Salaam · community court
        </p>
        <h1 className="mt-4 max-w-3xl font-[family-name:var(--font-display)] text-6xl font-extrabold uppercase leading-[0.95] tracking-tight text-[var(--color-ink)] md:text-8xl">
          Show up.
          <br />
          Play the <span className="text-[var(--color-court)]">kitchen</span>.
          <br />
          Climb the board.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-[var(--color-ink-muted)]">
          One place for the club to RSVP to sessions, log results, and see
          who&apos;s actually winning — no more WhatsApp scroll-back to find
          last week&apos;s score.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/signup"
            className="rounded-[var(--radius-pill)] bg-[var(--color-court)] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)]"
          >
            Join the club
          </Link>
          <Link
            href="/leaderboard"
            className="rounded-[var(--radius-pill)] border border-[var(--color-line)] px-6 py-3 text-base font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-court)] hover:text-[var(--color-court)]"
          >
            See the leaderboard
          </Link>
        </div>
      </section>

      {/* How it works — the four-step arc is a real sequence, so numbering it is earned */}
      <section className="kitchen-line border-t-0 bg-[var(--color-paper-raised)]">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
            How it works
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-4">
            {steps.map((step, i) => (
              <div key={step.label}>
                <span className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-ink-muted)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold uppercase text-[var(--color-ink)]">
                  {step.label}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-muted)]">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h2 className="mx-auto max-w-2xl font-[family-name:var(--font-display)] text-4xl font-extrabold uppercase leading-tight text-[var(--color-ink)] md:text-5xl">
          Bring your paddle. We&apos;ll handle the standings.
        </h2>
        <Link
          href="/signup"
          className="mt-8 inline-block rounded-[var(--radius-pill)] bg-[var(--color-court)] px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)]"
        >
          Request to join
        </Link>
      </section>
    </div>
  );
}
