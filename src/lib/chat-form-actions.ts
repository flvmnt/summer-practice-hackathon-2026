"use server";

import { randomUUID } from "node:crypto";
import { postMessageAction } from "@/lib/chat";

export type GroupChatFormState = {
  error?: string;
  sent?: boolean;
};

function stringField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function postGroupMessageFormAction(
  _previousState: GroupChatFormState,
  formData: FormData,
): Promise<GroupChatFormState> {
  const result = await postMessageAction({
    groupId: stringField(formData, "groupId"),
    body: stringField(formData, "body"),
    clientId: stringField(formData, "clientId") || randomUUID(),
  });

  if (!result.ok) {
    return { error: result.error };
  }

  return { sent: true };
}
