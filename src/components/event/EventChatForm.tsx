"use client";

import { Send } from "lucide-react";
import { useActionState } from "react";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import {
  postEventMessageFormAction,
  type EventChatFormState,
} from "@/lib/event-form-actions";

type EventChatFormCopy = {
  messagePlaceholder: string;
  send: string;
  sending: string;
  genericError: string;
};

const initialState: EventChatFormState = {};

export function EventChatForm({
  copy,
  eventId,
}: {
  copy: EventChatFormCopy;
  eventId: string;
}) {
  const [state, formAction] = useActionState(postEventMessageFormAction, initialState);

  return (
    <form action={formAction} className="grid gap-3">
      <input name="eventId" type="hidden" value={eventId} />
      <label className="grid gap-2 text-sm font-semibold">
        <span className="sr-only">{copy.messagePlaceholder}</span>
        <textarea
          className="min-h-28 resize-y rounded-md border border-[var(--line)] bg-white px-3 py-3 text-base font-normal outline-none transition-colors focus:border-[var(--court)]"
          maxLength={1000}
          name="body"
          placeholder={copy.messagePlaceholder}
          required
        />
      </label>
      {state.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-[var(--danger)]">
          {copy.genericError}
        </p>
      ) : null}
      <AuthSubmitButton label={copy.send} pendingLabel={copy.sending} />
      <Send aria-hidden="true" className="hidden" />
    </form>
  );
}
