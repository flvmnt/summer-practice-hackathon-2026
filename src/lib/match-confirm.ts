import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { groupMembers, groups } from "@/db/schema";

export type ConfirmMembershipResult =
  | { ok: true; status: "confirmed" }
  | { ok: false; reason: "not_member" | "not_invited" | "group_inactive" };

export type DeclineMembershipResult =
  | { ok: true; status: "declined" }
  | { ok: false; reason: "not_member" | "not_invited" | "group_inactive" };

/**
 * Atomically transition the caller's group_members row from 'invited' -> 'confirmed'.
 *
 * Uses a single UPDATE with a WHERE filter that also joins to `groups` so we
 * never read-then-write. The filter enforces:
 *   - the row belongs to (groupId, userId)
 *   - the current status is 'invited'
 *   - the parent group's status is 'active'
 *
 * If 0 rows are updated we run a small classification query to give the caller
 * a useful reason code (still no race window: by the time we classify, the
 * caller has already lost the only chance to flip the row).
 */
export async function confirmMembership(
  userId: string,
  groupId: string,
): Promise<ConfirmMembershipResult> {
  const db = getDb();

  const updated = await db
    .update(groupMembers)
    .set({ status: "confirmed" })
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId),
        eq(groupMembers.status, "invited"),
        sql`exists (select 1 from ${groups} where ${groups.id} = ${groupMembers.groupId} and ${groups.status} = 'active')`,
      ),
    )
    .returning({ userId: groupMembers.userId });

  if (updated.length > 0) {
    return { ok: true, status: "confirmed" };
  }

  return classifyFailure(userId, groupId);
}

/**
 * Atomically transition the caller's group_members row from 'invited' -> 'declined'.
 *
 * Same pattern as confirmMembership: a single UPDATE with WHERE-based
 * ownership and state guards. Only an 'invited' row may be declined; an
 * already-confirmed member should call leaveGroupAction instead.
 */
export async function declineMembership(
  userId: string,
  groupId: string,
): Promise<DeclineMembershipResult> {
  const db = getDb();

  const updated = await db
    .update(groupMembers)
    .set({ status: "declined" })
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId),
        eq(groupMembers.status, "invited"),
        sql`exists (select 1 from ${groups} where ${groups.id} = ${groupMembers.groupId} and ${groups.status} = 'active')`,
      ),
    )
    .returning({ userId: groupMembers.userId });

  if (updated.length > 0) {
    return { ok: true, status: "declined" };
  }

  return classifyFailure(userId, groupId);
}

async function classifyFailure(
  userId: string,
  groupId: string,
): Promise<{ ok: false; reason: "not_member" | "not_invited" | "group_inactive" }> {
  const db = getDb();

  const [row] = await db
    .select({
      memberStatus: groupMembers.status,
      groupStatus: groups.status,
    })
    .from(groupMembers)
    .innerJoin(groups, eq(groups.id, groupMembers.groupId))
    .where(
      and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)),
    )
    .limit(1);

  if (!row) {
    return { ok: false, reason: "not_member" };
  }

  if (row.groupStatus !== "active") {
    return { ok: false, reason: "group_inactive" };
  }

  return { ok: false, reason: "not_invited" };
}
