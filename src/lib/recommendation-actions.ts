"use server";

import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { groupMembers, groups, messages, users } from "@/db/schema";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth-current-user";
import {
  getRecommendationsForGroupInputSchema,
  inviteRecommendedInputSchema,
  type GetRecommendationsForGroupInput,
  type InviteRecommendedInput,
} from "@/lib/contracts/recommendations";
import {
  recommendTeammatesForGroup,
  type RecommendationCandidate,
} from "@/lib/recommendations";

/**
 * Server actions for the smart-teammate-recommendations surface.
 *
 * Both actions are auth-gated and ownership-checked: only the group's
 * captain can fetch recommendations or invite a recommended user. The
 * read path is intentionally not rate-limited (it's a side-effect-free
 * lookup), but `inviteRecommendedAction` returns a stable `conflict`
 * error code if the candidate is already invited or confirmed elsewhere
 * for the same prompt so the UI can surface the right message instead
 * of throwing past the action boundary.
 */

async function loadCaptainGroup(groupId: string, userId: string) {
  const [row] = await getDb()
    .select({
      id: groups.id,
      promptId: groups.promptId,
      captainUserId: groups.captainUserId,
      sizeTarget: groups.sizeTarget,
      status: groups.status,
      demoRunId: groups.demoRunId,
    })
    .from(groups)
    .where(eq(groups.id, groupId))
    .limit(1);

  if (!row) return null;
  if (row.status !== "active") return null;
  if (row.captainUserId !== userId) return null;
  return row;
}

export async function getRecommendationsForGroupAction(
  input: GetRecommendationsForGroupInput,
): Promise<ActionResult<{ candidates: RecommendationCandidate[] }>> {
  const parsed = getRecommendationsForGroupInputSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("validation");
  }

  const user = await getCurrentUser();
  if (!user) {
    return actionError("unauthorized");
  }

  const group = await loadCaptainGroup(parsed.data.groupId, user.id);
  if (!group) {
    return actionError("unauthorized");
  }

  try {
    const candidates = await recommendTeammatesForGroup(parsed.data.groupId);
    return actionOk({ candidates });
  } catch {
    return actionError("internal");
  }
}

export async function inviteRecommendedAction(
  input: InviteRecommendedInput,
): Promise<ActionResult<{ status: "invited" | "already_invited" }>> {
  const parsed = inviteRecommendedInputSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("validation");
  }

  const user = await getCurrentUser();
  if (!user) {
    return actionError("unauthorized");
  }

  const group = await loadCaptainGroup(parsed.data.groupId, user.id);
  if (!group) {
    return actionError("unauthorized");
  }

  if (parsed.data.userId === user.id) {
    return actionError("validation");
  }

  const db = getDb();

  // Verify the candidate exists and is not banned/deleted.
  const [candidate] = await db
    .select({
      id: users.id,
      demoRunId: users.demoRunId,
      bannedAt: users.bannedAt,
      deletedAt: users.deletedAt,
    })
    .from(users)
    .where(eq(users.id, parsed.data.userId))
    .limit(1);

  if (!candidate || candidate.bannedAt || candidate.deletedAt) {
    return actionError("not_found");
  }

  // Block double-invites: spec says recs must exclude already-confirmed
  // members and avoid stomping someone already invited elsewhere for
  // the same prompt window. The schema's partial unique index would
  // also reject this, but a clean conflict response keeps UX honest.
  const existing = await db
    .select({
      groupId: groupMembers.groupId,
      status: groupMembers.status,
    })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.promptId, group.promptId),
        eq(groupMembers.userId, parsed.data.userId),
        inArray(groupMembers.status, ["invited", "confirmed"]),
      ),
    );

  if (existing.length > 0) {
    if (existing.some((row) => row.groupId === group.id)) {
      return actionOk({ status: "already_invited" });
    }
    return actionError("conflict");
  }

  // Check capacity. We only want to invite up to sizeTarget; we keep
  // the read cheap by limiting to sizeTarget+1 rows and counting in JS.
  const seats = await db
    .select({ userId: groupMembers.userId })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, group.id),
        inArray(groupMembers.status, ["invited", "confirmed"]),
      ),
    )
    .limit(group.sizeTarget + 1);

  if (seats.length >= group.sizeTarget) {
    return actionError("conflict");
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .insert(groupMembers)
        .values({
          demoRunId: group.demoRunId ?? candidate.demoRunId,
          groupId: group.id,
          promptId: group.promptId,
          userId: parsed.data.userId,
          role: "player",
          status: "invited",
        })
        .onConflictDoNothing({
          target: [groupMembers.groupId, groupMembers.userId],
        });

      // System message in group chat for traceability. Mirrors the
      // event-proposed pattern used by manual-event-actions.ts.
      await tx.insert(messages).values({
        demoRunId: group.demoRunId ?? candidate.demoRunId,
        scopeType: "group",
        groupId: group.id,
        userId: user.id,
        kind: "rec_invite",
        body: "captain_invited_recommended_teammate",
      });
    });
  } catch {
    return actionError("internal");
  }

  return actionOk({ status: "invited" });
}
