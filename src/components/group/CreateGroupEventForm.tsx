"use client";

import { CalendarPlus } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import {
  createGroupEventFormAction,
  type CreateGroupEventFormState,
} from "@/lib/event-form-actions";

type CreateGroupEventFormCopy = {
  create: string;
  creating: string;
  created: string;
  openEvent: string;
  genericError: string;
};

const initialState: CreateGroupEventFormState = {};

export function CreateGroupEventForm({
  copy,
  groupId,
  locale,
}: {
  copy: CreateGroupEventFormCopy;
  groupId: string;
  locale: string;
}) {
  const [state, formAction] = useActionState(createGroupEventFormAction, initialState);

  return (
    <form action={formAction} className="grid gap-3">
      <input name="groupId" type="hidden" value={groupId} />
      {state.event ? (
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[var(--court)] px-4 text-sm font-semibold text-white"
          href={`/${locale}/events/${state.event.id}`}
        >
          <CalendarPlus aria-hidden="true" size={18} />
          {copy.openEvent}
        </Link>
      ) : (
        <AuthSubmitButton label={copy.create} pendingLabel={copy.creating} />
      )}
      {state.event ? (
        <p className="text-sm font-semibold text-[var(--muted)]">{copy.created}</p>
      ) : null}
      {state.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-[var(--danger)]">
          {copy.genericError}
        </p>
      ) : null}
    </form>
  );
}
