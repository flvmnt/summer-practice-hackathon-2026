"use server";

import { z } from "zod";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import { requireUserForAction } from "@/lib/auth-current-user";
import {
  confirmMembership,
  declineMembership,
} from "@/lib/match-confirm";

const inputSchema = z.object({
  groupId: z.string().uuid(),
});

function readField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function reasonToError(
  reason: "not_member" | "not_invited" | "group_inactive",
): { error: string; conflict?: string } {
  switch (reason) {
    case "not_member":
      return { error: "not_found" };
    case "not_invited":
      return { error: "conflict", conflict: "not_invited" };
    case "group_inactive":
      return { error: "conflict", conflict: "group_inactive" };
  }
}

export async function confirmMembershipAction(
  formData: FormData,
): Promise<ActionResult<{ status: "confirmed" }>> {
  const auth = await requireUserForAction();
  if (!auth.ok) {
    return actionError(auth.error);
  }
  const user = auth.user;

  const parsed = inputSchema.safeParse({
    groupId: readField(formData, "groupId"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return actionError("validation", { fieldErrors });
  }

  const result = await confirmMembership(user.id, parsed.data.groupId);
  if (!result.ok) {
    return actionError(reasonToError(result.reason).error);
  }

  return actionOk({ status: result.status });
}

export async function declineMembershipAction(
  formData: FormData,
): Promise<ActionResult<{ status: "declined" }>> {
  const auth = await requireUserForAction();
  if (!auth.ok) {
    return actionError(auth.error);
  }
  const user = auth.user;

  const parsed = inputSchema.safeParse({
    groupId: readField(formData, "groupId"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return actionError("validation", { fieldErrors });
  }

  const result = await declineMembership(user.id, parsed.data.groupId);
  if (!result.ok) {
    return actionError(reasonToError(result.reason).error);
  }

  return actionOk({ status: result.status });
}
