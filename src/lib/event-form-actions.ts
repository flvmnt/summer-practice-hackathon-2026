"use server";

import { randomUUID } from "node:crypto";
import { postEventMessageAction } from "@/lib/chat";
import { createGroupEventAction } from "@/lib/events";
import { createEventInviteAction, revokeEventInviteAction } from "@/lib/invites";
import { castVenueVoteAction } from "@/lib/votes";

export type CreateGroupEventFormState = {
  error?: string;
  event?: {
    id: string;
    title: string;
  };
};

export type EventChatFormState = {
  error?: string;
  sent?: boolean;
};

export type VenueVoteFormState = {
  error?: string;
  voted?: boolean;
};

export type EventInviteFormState = {
  error?: string;
  invitePath?: string;
  revoked?: boolean;
};

function stringField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function createGroupEventFormAction(
  _previousState: CreateGroupEventFormState,
  formData: FormData,
): Promise<CreateGroupEventFormState> {
  const result = await createGroupEventAction({
    groupId: stringField(formData, "groupId"),
  });

  if (!result.ok) {
    return { error: result.error };
  }

  return {
    event: {
      id: result.data.event.id,
      title: result.data.event.title,
    },
  };
}

export async function postEventMessageFormAction(
  _previousState: EventChatFormState,
  formData: FormData,
): Promise<EventChatFormState> {
  const result = await postEventMessageAction({
    eventId: stringField(formData, "eventId"),
    body: stringField(formData, "body"),
    clientId: stringField(formData, "clientId") || randomUUID(),
  });

  if (!result.ok) {
    return { error: result.error };
  }

  return { sent: true };
}

export async function castVenueVoteFormAction(
  _previousState: VenueVoteFormState,
  formData: FormData,
): Promise<VenueVoteFormState> {
  const result = await castVenueVoteAction({
    eventId: stringField(formData, "eventId"),
    optionIdx: Number(stringField(formData, "optionIdx")),
  });

  if (!result.ok) {
    return { error: result.error };
  }

  return { voted: true };
}

export async function createEventInviteFormAction(
  _previousState: EventInviteFormState,
  formData: FormData,
): Promise<EventInviteFormState> {
  const result = await createEventInviteAction({
    eventId: stringField(formData, "eventId"),
    locale: stringField(formData, "locale") === "en" ? "en" : "ro",
  });

  if (!result.ok) {
    return { error: result.error };
  }

  return { invitePath: result.data.invitePath };
}

export async function revokeEventInviteFormAction(
  _previousState: EventInviteFormState,
  formData: FormData,
): Promise<EventInviteFormState> {
  const result = await revokeEventInviteAction({
    eventId: stringField(formData, "eventId"),
    locale: stringField(formData, "locale") === "en" ? "en" : "ro",
  });

  if (!result.ok) {
    return { error: result.error };
  }

  return { revoked: true };
}
