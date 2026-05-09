"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Glyph } from "@/components/ui/Glyph";
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
  const [state, formAction] = useActionState(
    createGroupEventFormAction,
    initialState,
  );

  if (state.event) {
    return (
      <div className="flex flex-col gap-2">
        <Link
          href={`/${locale}/events/${state.event.id}`}
          className="btn-s2m"
          style={{ minHeight: 48, fontSize: 14 }}
        >
          <Glyph.cal size={18} />
          {copy.openEvent}
        </Link>
        <p
          className="text-[12px] font-semibold"
          style={{ color: "var(--field)" }}
        >
          {copy.created}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input name="groupId" type="hidden" value={groupId} />
      <CreateButton label={copy.create} pendingLabel={copy.creating} />
      {state.error ? (
        <p
          role="alert"
          className="text-[12px] font-semibold"
          style={{ color: "var(--alert)" }}
        >
          {copy.genericError}
        </p>
      ) : null}
    </form>
  );
}

function CreateButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="btn-s2m"
      disabled={pending}
      aria-busy={pending || undefined}
      style={{ minHeight: 48, fontSize: 14, opacity: pending ? 0.7 : 1 }}
    >
      <Glyph.plus size={18} />
      {pending ? pendingLabel : label}
    </button>
  );
}
