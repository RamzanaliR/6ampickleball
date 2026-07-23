import Link from "next/link";
import { formatSessionDate, formatSessionTime } from "@/lib/format";
import { RsvpButton } from "@/components/rsvp-button";
import { WhatsAppShareButton } from "@/components/whatsapp-share-button";
import { AddGuestModal } from "@/components/add-guest-modal";
import { NoShowModal } from "@/components/no-show-modal";
import { ViewGuestsModal } from "@/components/view-guests-modal";

type RsvpState = "confirmed" | "waitlisted" | "none";

/** Row-major "snake" order (left-to-right, top-to-bottom). Caps at 2
 *  columns on narrow screens so long names don't wrap and throw off
 *  row heights — widens to 3 from `sm` up. */
function confirmedGridClass(count: number) {
  if (count <= 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-2";
  return "grid-cols-2 sm:grid-cols-3";
}

const secondaryButtonClass =
  "block w-full rounded-[var(--radius-pill)] border border-[var(--color-line)] px-4 py-2 text-center text-sm font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-court)] hover:text-[var(--color-court)]";

export function SessionCard({
  session,
  spotsLeft,
  myStatus,
  confirmedNames,
  isStaff = false,
  knownGuestNames = [],
  variant = "upcoming",
  rainRisk,
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
  confirmedNames?: string[];
  isStaff?: boolean;
  knownGuestNames?: string[];
  variant?: "upcoming" | "current";
  rainRisk?: { pop: number; description: string } | null;
}) {
  const full = spotsLeft <= 0;
  const names = confirmedNames ?? [];
  const columns = confirmedGridClass(names.length);
  const guestCount = names.filter((n) => n.endsWith(" (G)")).length;

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_190px]">
        {/* Left: session info */}
        <div>
          <Link href={`/sessions/${session.id}`} className="block">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[var(--color-court)]">
                {formatSessionDate(session.date_time)} · {formatSessionTime(session.date_time)}
              </p>
              {variant === "current" && (
                <span className="rounded-[var(--radius-pill)] bg-[var(--color-court)] px-3 py-0.5 text-xs font-semibold text-white">
                  Fixtures live
                </span>
              )}
            </div>
            <p className="mt-0.5 font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[var(--color-court)]">
              {session.location}
            </p>
            <h3 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold uppercase tracking-tight text-[var(--color-ink)] hover:text-[var(--color-court)]">
              {session.title}
            </h3>
            {!session.counts_toward_leaderboard && (
              <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                Doesn&apos;t count toward the season leaderboard
              </p>
            )}
          </Link>

          {rainRisk && rainRisk.pop >= 0.4 && (
            <p className="mt-2 rounded-[var(--radius-input)] bg-[var(--color-danger-bg)] px-3 py-1.5 text-xs font-medium text-[var(--color-danger)]">
              ⚠️ {Math.round(rainRisk.pop * 100)}% chance of rain — have a backup plan
            </p>
          )}

          {names.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-[var(--color-ink)]">
                Confirmed: ({names.length})
                {guestCount > 0 && (
                  <span className="font-normal text-[var(--color-ink-muted)]">
                    {" "}
                    — {names.length - guestCount} members, {guestCount} guests
                  </span>
                )}
              </p>
              <div className={`mt-1.5 grid ${columns} gap-x-6 gap-y-0.5 text-xs text-[var(--color-ink-muted)]`}>
                {names.map((name) => (
                  <p key={name} className="py-0.5">
                    {name}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: action stack */}
        <div className="flex flex-col gap-2">
          <div className="mb-2">
            <RsvpButton sessionId={session.id} initialStatus={myStatus} full={full} />
            {variant === "upcoming" && (
              <p className="mt-1.5 text-center font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink-muted)]">
                {full ? "Full — waitlist open" : `${spotsLeft} of ${session.capacity} spots left`}
              </p>
            )}
          </div>

          {/* Add guest / View fixtures slot */}
          {isStaff ? (
            <AddGuestModal
              sessionId={session.id}
              knownGuestNames={knownGuestNames}
              triggerLabel="Add Guests"
              triggerClassName={secondaryButtonClass}
            />
          ) : (
            variant === "current" && (
              <Link href={`/sessions/${session.id}`} className={secondaryButtonClass}>
                View Fixtures
              </Link>
            )
          )}

          {/* Generate fixtures / View guests slot (staff only) */}
          {isStaff &&
            (variant === "upcoming" ? (
              <Link href={`/admin/sessions/${session.id}/fixtures`} className={secondaryButtonClass}>
                Generate Fixtures
              </Link>
            ) : (
              <ViewGuestsModal sessionId={session.id} triggerClassName={secondaryButtonClass} />
            ))}

          {isStaff && (
            <div className="flex items-center gap-2">
              <NoShowModal
                sessionId={session.id}
                triggerLabel="No-show"
                triggerClassName={`${secondaryButtonClass} flex-1`}
              />
              <WhatsAppShareButton
                title={session.title}
                dateTime={session.date_time}
                location={session.location}
                iconOnly
              />
            </div>
          )}
          {!isStaff && (
            <div className="mt-1 flex justify-end">
              <WhatsAppShareButton
                title={session.title}
                dateTime={session.date_time}
                location={session.location}
                iconOnly
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
