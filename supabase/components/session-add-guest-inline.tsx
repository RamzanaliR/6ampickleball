"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/form-field";
import { TypeaheadSelect } from "@/components/typeahead-select";
import { addGuestToSession } from "@/lib/actions/guests";

export function SessionAddGuestInline({
  sessionId,
  knownGuests,
}: {
  sessionId: string;
  knownGuests: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"new" | "returning">("new");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await addGuestToSession(sessionId, {}, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        router.refresh();
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 text-sm font-medium text-[var(--color-court)] hover:text-[var(--color-court-dark)]"
      >
        + Add guest
      </button>
    );
  }

  return (
    <form
      action={handleSubmit}
      className="mt-3 space-y-3 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-4"
    >
      {knownGuests.length > 0 && (
        <div className="flex gap-2">
          <TabButton active={mode === "new"} onClick={() => setMode("new")}>
            New guest
          </TabButton>
          <TabButton active={mode === "returning"} onClick={() => setMode("returning")}>
            Returning guest
          </TabButton>
        </div>
      )}

      {mode === "new" || knownGuests.length === 0 ? (
        <FormField label="Guest name" name="name" placeholder="Full name" />
      ) : (
        <label className="block">
          <span className="text-sm font-medium text-[var(--color-ink)]">Guest</span>
          <div className="mt-1.5">
            <TypeaheadSelect
              name="existing_guest_id"
              options={knownGuests.map((g) => ({ id: g.id, label: g.name }))}
              placeholder="Type a name…"
              emptyMessage="No matching guests"
            />
          </div>
        </label>
      )}

      {error && (
        <p className="rounded-[var(--radius-input)] bg-[var(--color-danger-bg)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-[var(--radius-pill)] bg-[var(--color-court)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)] disabled:opacity-60"
        >
          {isPending ? "Adding…" : "Add to session"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={isPending}
          className="rounded-[var(--radius-pill)] border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink)]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-[var(--radius-pill)] bg-[var(--color-court)] px-3 py-1.5 text-xs font-semibold text-white"
          : "rounded-[var(--radius-pill)] border border-[var(--color-line)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink)]"
      }
    >
      {children}
    </button>
  );
}
