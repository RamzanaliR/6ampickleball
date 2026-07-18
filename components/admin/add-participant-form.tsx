"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { FormField } from "@/components/form-field";
import { TypeaheadSelect } from "@/components/typeahead-select";
import { addGuestToSession, addMemberToSession, type AddGuestState, type AddMemberToSessionState } from "@/lib/actions/guests";

const initialGuestState: AddGuestState = {};
const initialMemberState: AddMemberToSessionState = {};

export function AddParticipantForm({
  sessionId,
  addableMembers,
  knownGuests,
}: {
  sessionId: string;
  addableMembers: { id: string; name: string }[];
  knownGuests: { id: string; name: string }[];
}) {
  const [participantType, setParticipantType] = useState<"member" | "guest">("member");
  const [guestMode, setGuestMode] = useState<"new" | "returning">("new");

  const boundGuestAction = addGuestToSession.bind(null, sessionId);
  const [guestState, guestFormAction] = useActionState(boundGuestAction, initialGuestState);

  const boundMemberAction = addMemberToSession.bind(null, sessionId);
  const [memberState, memberFormAction] = useActionState(boundMemberAction, initialMemberState);

  const formAction = participantType === "member" ? memberFormAction : guestFormAction;
  const error = participantType === "member" ? memberState.error : guestState.error;

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex gap-2">
        <TabButton active={participantType === "member"} onClick={() => setParticipantType("member")}>
          Member
        </TabButton>
        <TabButton active={participantType === "guest"} onClick={() => setParticipantType("guest")}>
          Guest
        </TabButton>
      </div>

      {participantType === "member" ? (
        <label className="block">
          <span className="text-sm font-medium text-[var(--color-ink)]">Member</span>
          <div className="mt-1.5">
            <TypeaheadSelect
              name="player_id"
              options={addableMembers.map((m) => ({ id: m.id, label: m.name }))}
              placeholder={addableMembers.length === 0 ? "Everyone's already confirmed" : "Type a name…"}
              emptyMessage="No matching members"
            />
          </div>
        </label>
      ) : (
        <>
          {knownGuests.length > 0 && (
            <div className="flex gap-2">
              <TabButton active={guestMode === "new"} onClick={() => setGuestMode("new")}>
                New guest
              </TabButton>
              <TabButton active={guestMode === "returning"} onClick={() => setGuestMode("returning")}>
                Returning guest
              </TabButton>
            </div>
          )}

          {guestMode === "new" || knownGuests.length === 0 ? (
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
        </>
      )}

      {error && (
        <p className="rounded-[var(--radius-input)] bg-[var(--color-danger-bg)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}

      <SubmitButton />
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

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-[var(--radius-pill)] bg-[var(--color-court)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)] disabled:opacity-60"
    >
      {pending ? "Adding…" : "Add to session"}
    </button>
  );
}
