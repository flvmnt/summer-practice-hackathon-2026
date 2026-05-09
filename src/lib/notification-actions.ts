"use server";

import { z } from "zod";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth-current-user";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
} from "@/lib/notifications";

export type FetchNotificationsResult =
  | { ok: true; notifications: Notification[] }
  | { ok: false; error: "unauthorized" };

const FETCH_LIMIT = 50;

export async function fetchNotificationsAction(): Promise<FetchNotificationsResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "unauthorized" };
  }

  const items = await listNotifications(user.id, { limit: FETCH_LIMIT });
  return { ok: true, notifications: items };
}

const markReadInputSchema = z.object({
  notificationId: z.string().uuid(),
});

function stringField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function markNotificationReadAction(
  formData: FormData,
): Promise<ActionResult<{ updated: boolean }>> {
  const parsed = markReadInputSchema.safeParse({
    notificationId: stringField(formData, "notificationId"),
  });
  if (!parsed.success) {
    return actionError("validation");
  }

  const user = await getCurrentUser();
  if (!user) {
    return actionError("unauthorized");
  }

  const updated = await markNotificationRead(user.id, parsed.data.notificationId);
  return actionOk({ updated });
}

export async function markAllNotificationsReadAction(): Promise<
  ActionResult<{ updated: number }>
> {
  const user = await getCurrentUser();
  if (!user) {
    return actionError("unauthorized");
  }

  const updated = await markAllNotificationsRead(user.id);
  return actionOk({ updated });
}
