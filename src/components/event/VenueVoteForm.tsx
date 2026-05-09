"use client";

import { Vote } from "lucide-react";
import { useActionState } from "react";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import {
  castVenueVoteFormAction,
  type VenueVoteFormState,
} from "@/lib/event-form-actions";

type VenueVoteFormCopy = {
  vote: string;
  voting: string;
  voted: string;
  genericError: string;
};

const initialState: VenueVoteFormState = {};

export function VenueVoteForm({
  copy,
  eventId,
  optionIdx,
  selected,
}: {
  copy: VenueVoteFormCopy;
  eventId: string;
  optionIdx: number;
  selected: boolean;
}) {
  const [state, formAction] = useActionState(castVenueVoteFormAction, initialState);

  return (
    <form action={formAction} className="grid gap-2">
      <input name="eventId" type="hidden" value={eventId} />
      <input name="optionIdx" type="hidden" value={optionIdx} />
      <AuthSubmitButton
        label={selected || state.voted ? copy.voted : copy.vote}
        pendingLabel={copy.voting}
      />
      {state.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-[var(--danger)]">
          {copy.genericError}
        </p>
      ) : null}
      <Vote aria-hidden="true" className="hidden" />
    </form>
  );
}
