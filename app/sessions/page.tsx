import { PageHeader } from "@/components/page-header";

export default function SessionsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="This week & beyond"
        title="Sessions"
        subtitle="RSVP, waitlists, and session details arrive in Phase 2."
      />
      <div className="mx-auto mt-8 max-w-6xl px-6 pb-16">
        <EmptyState message="No sessions yet — the admin hasn't scheduled one." />
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="kitchen-line rounded-[var(--radius-card)] border border-dashed border-[var(--color-line)] bg-[var(--color-paper-raised)] p-10 text-center">
      <p className="text-[var(--color-ink-muted)]">{message}</p>
    </div>
  );
}
