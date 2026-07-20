"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { setPlayerRole } from "@/lib/actions/admin-players";

const roleLabels: Record<"player" | "manager" | "admin", string> = {
  player: "Player",
  manager: "Manager",
  admin: "Admin",
};

const roleDescriptions: Record<"player" | "manager" | "admin", string> = {
  player: "No admin access — a regular club member.",
  manager: "Can create sessions, add guests/members, generate fixtures, approve Club posts, flag no-shows, and edit player details. No access to finances, dues, tournaments, or removing/promoting people.",
  admin: "Full access — everything a Manager can do, plus finances, dues, tournaments, removing people, password resets, and role changes.",
};

export function RoleSelectButton({
  playerId,
  playerName,
  currentRole,
}: {
  playerId: string;
  playerName: string;
  currentRole: "player" | "manager" | "admin";
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<"player" | "manager" | "admin">(currentRole);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleOpen() {
    setSelected(currentRole);
    setError(null);
    setOpen(true);
  }

  function handleConfirm() {
    if (selected === currentRole) {
      setOpen(false);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await setPlayerRole(playerId, selected);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="text-xs font-medium text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-court)]"
      >
        {roleLabels[currentRole]}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Set role for ${playerName}`}>
        <div className="space-y-4">
          <div className="space-y-2">
            {(["player", "manager", "admin"] as const).map((r) => (
              <label
                key={r}
                className={`flex cursor-pointer items-start gap-3 rounded-[var(--radius-card)] border p-3 transition-colors ${
                  selected === r
                    ? "border-[var(--color-court)] bg-[var(--color-court)]/5"
                    : "border-[var(--color-line)]"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={r}
                  checked={selected === r}
                  onChange={() => setSelected(r)}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-medium text-[var(--color-ink)]">
                    {roleLabels[r]}
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--color-ink-muted)]">
                    {roleDescriptions[r]}
                  </span>
                </span>
              </label>
            ))}
          </div>
          {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPending}
              className="rounded-[var(--radius-pill)] bg-[var(--color-court)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)] disabled:opacity-60"
            >
              {isPending ? "Saving…" : "Save"}
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
        </div>
      </Modal>
    </>
  );
}
