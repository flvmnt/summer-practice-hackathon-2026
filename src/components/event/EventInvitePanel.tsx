"use client";

import { Copy, Share2, ShieldOff } from "lucide-react";
import { useActionState, useState } from "react";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import {
  createEventInviteFormAction,
  revokeEventInviteFormAction,
  type EventInviteFormState,
} from "@/lib/event-form-actions";

type EventInviteCopy = {
  title: string;
  body: string;
  create: string;
  creating: string;
  share: string;
  copy: string;
  copied: string;
  revoke: string;
  revoking: string;
  revoked: string;
  genericError: string;
};

const initialState: EventInviteFormState = {};

export function EventInvitePanel({
  copy,
  eventId,
  locale,
}: {
  copy: EventInviteCopy;
  eventId: string;
  locale: "ro" | "en";
}) {
  const [createState, createAction] = useActionState(
    createEventInviteFormAction,
    initialState,
  );
  const [revokeState, revokeAction] = useActionState(
    revokeEventInviteFormAction,
    initialState,
  );
  const [copied, setCopied] = useState(false);
  const invitePath = revokeState.revoked ? null : createState.invitePath;

  function currentInviteUrl() {
    return invitePath ? new URL(invitePath, window.location.origin).href : null;
  }

  async function copyInvite() {
    const inviteUrl = currentInviteUrl();
    if (!inviteUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  async function shareInvite() {
    const inviteUrl = currentInviteUrl();
    if (!inviteUrl) {
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({ title: "ShowUp2Move", url: inviteUrl });
      } catch {
        return;
      }
      return;
    }

    await copyInvite();
  }

  return (
    <div className="mt-5 rounded-md border border-[var(--line)] bg-white p-3">
      <div className="mb-3 flex items-center gap-2">
        <Share2 aria-hidden="true" size={18} />
        <h2 className="text-sm font-bold">{copy.title}</h2>
      </div>
      <p className="mb-3 text-sm leading-6 text-[var(--muted)]">{copy.body}</p>
      <form action={createAction}>
        <input name="eventId" type="hidden" value={eventId} />
        <input name="locale" type="hidden" value={locale} />
        <AuthSubmitButton label={copy.create} pendingLabel={copy.creating} />
      </form>
      {invitePath ? (
        <div className="mt-3 grid gap-2">
          <p className="break-all rounded-md bg-[var(--cloud)] px-3 py-2 text-xs font-semibold text-[var(--muted)]">
            {invitePath}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-white px-3 text-sm font-semibold"
              type="button"
              onClick={shareInvite}
            >
              <Share2 aria-hidden="true" size={16} />
              {copy.share}
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-white px-3 text-sm font-semibold"
              type="button"
              onClick={copyInvite}
            >
              <Copy aria-hidden="true" size={16} />
              {copied ? copy.copied : copy.copy}
            </button>
          </div>
        </div>
      ) : null}
      <form action={revokeAction} className="mt-3">
        <input name="eventId" type="hidden" value={eventId} />
        <input name="locale" type="hidden" value={locale} />
        <AuthSubmitButton label={copy.revoke} pendingLabel={copy.revoking} />
      </form>
      {revokeState.revoked ? (
        <p className="mt-3 rounded-md bg-[var(--cloud)] px-3 py-2 text-sm font-semibold">
          {copy.revoked}
        </p>
      ) : null}
      {createState.error || revokeState.error ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-[var(--danger)]">
          {copy.genericError}
        </p>
      ) : null}
      <ShieldOff aria-hidden="true" className="hidden" />
    </div>
  );
}
