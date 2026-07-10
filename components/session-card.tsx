import { formatSessionDate, formatSessionTime } from "@/lib/format";
import { RsvpButton } from "@/components/rsvp-button";
import { WhatsAppShareButton } from "@/components/whatsapp-share-button";

type RsvpState = "confirmed" | "waitlisted" | "none";

export function SessionCard({
  session,
  spotsLeft,
  myStatus,
}: {
  session: {
    id: string;
    title: string;
    date_time: string;
    location: string;
    capacity: number;
    counts_toward_leaderboard: boolean;
  };
  spotsLeft: number;
  myStatus: RsvpState;
}) {
  const full = spotsLeft <= 0;

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[var(--color-court)]">
            {formatSessionDate(session.date_time)} · {formatSessionTime(session.date_time)}
          </p>
          <h3 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
            {session.title}
          </h3>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{session.location}</p>
          {!session.counts_toward_leaderboard && (
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
              Doesn&apos;t count toward the season leaderboard
            </p>
          )}
        </div>
        {myStatus !== "none" && (
          <span
            className={
              myStatus === "confirmed"
                ? "shrink-0 rounded-[var(--radius-pill)] bg-[var(--color-court)] px-3 py-1 text-xs font-semibold text-white"
                : "shrink-0 rounded-[var(--radius-pill)] border border-[var(--color-ball)] bg-[var(--color-ball)]/30 px-3 py-1 text-xs font-semibold text-[var(--color-ink)]"
            }
          >
            {myStatus === "confirmed" ? "You're in" : "Waitlisted"}
          </span>
        )}
      </div>

      <div className="kitchen-line mt-4 flex items-center justify-between pt-4">
        <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-ink-muted)]">
          {full ? "Full — waitlist open" : `${spotsLeft} of ${session.capacity} spots left`}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex-1">
          <RsvpButton sessionId={session.id} initialStatus={myStatus} full={full} />
        </div>
        <WhatsAppShareButton
          title={session.title}
          dateTime={session.date_time}
          location={session.location}
        />
      </div>
    </div>
  );
}
