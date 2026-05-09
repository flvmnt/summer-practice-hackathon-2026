"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  availabilityResponses,
  groupMembers,
  groups,
  prompts,
  userSports,
  users,
} from "@/db/schema";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import {
  formDeterministicGroups,
  type FormedGroupDraft,
  type MatchCandidate,
} from "@/lib/matching-core";
import type { SportKey } from "@/lib/sports";

export type MatchedGroupSummary = {
  id: string;
  sport: SportKey;
  captainUserId: string | null;
  memberUserIds: string[];
};

type Db = ReturnType<typeof getDb>;
type Transaction = Parameters<Parameters<Db["transaction"]>[0]>[0];
type QueryExecutor = Db | Transaction;

async function existingGroupsForPrompt(
  db: QueryExecutor,
  promptId: string,
): Promise<MatchedGroupSummary[]> {
  const groupRows = await db
    .select({
      id: groups.id,
      sport: groups.sport,
      captainUserId: groups.captainUserId,
    })
    .from(groups)
    .where(eq(groups.promptId, promptId));

  if (groupRows.length === 0) {
    return [];
  }

  const memberRows = await db
    .select({
      groupId: groupMembers.groupId,
      userId: groupMembers.userId,
    })
    .from(groupMembers)
    .where(inArray(groupMembers.groupId, groupRows.map((group) => group.id)));

  return groupRows.map((group) => ({
    id: group.id,
    sport: group.sport as SportKey,
    captainUserId: group.captainUserId,
    memberUserIds: memberRows
      .filter((member) => member.groupId === group.id)
      .map((member) => member.userId),
  }));
}

async function existingMemberIdsForPrompt(
  db: QueryExecutor,
  promptId: string,
) {
  const rows = await db
    .select({ userId: groupMembers.userId })
    .from(groupMembers)
    .where(eq(groupMembers.promptId, promptId));

  return new Set(rows.map((row) => row.userId));
}

function numeric(value: string | null) {
  return value === null ? null : Number(value);
}

async function candidatesForPrompt(
  db: QueryExecutor,
  promptId: string,
): Promise<MatchCandidate[]> {
  const existingMemberIds = await existingMemberIdsForPrompt(db, promptId);
  const responseRows = await db
    .select({
      userId: availabilityResponses.userId,
      demoRunId: availabilityResponses.demoRunId,
      sportPrefs: availabilityResponses.sportPrefs,
      responseLat: availabilityResponses.lat,
      responseLng: availabilityResponses.lng,
      responseMaxDistanceKm: availabilityResponses.maxDistanceKm,
      respondedAt: availabilityResponses.updatedAt,
      city: users.city,
      userLat: users.homeLat,
      userLng: users.homeLng,
      userMaxDistanceKm: users.maxDistanceKm,
      skillLevel: users.skillLevel,
      bannedAt: users.bannedAt,
      deletedAt: users.deletedAt,
    })
    .from(availabilityResponses)
    .innerJoin(users, eq(users.id, availabilityResponses.userId))
    .where(
      and(
        eq(availabilityResponses.promptId, promptId),
        eq(availabilityResponses.answer, "yes"),
      ),
    );

  const userIds = responseRows.map((row) => row.userId);
  const sportRows =
    userIds.length > 0
      ? await db
          .select({
            userId: userSports.userId,
            sport: userSports.sport,
            level: userSports.level,
          })
          .from(userSports)
          .where(inArray(userSports.userId, userIds))
      : [];

  return responseRows.flatMap((row) => {
    if (existingMemberIds.has(row.userId) || row.bannedAt || row.deletedAt) {
      return [];
    }

    const lat = numeric(row.responseLat ?? row.userLat);
    const lng = numeric(row.responseLng ?? row.userLng);
    if (lat === null || lng === null) {
      return [];
    }

    const profileSports = sportRows
      .filter((sport) => sport.userId === row.userId)
      .map((sport) => sport.sport as SportKey);
    const sportPrefs = (row.sportPrefs as SportKey[] | null) ?? profileSports;
    if (sportPrefs.length === 0) {
      return [];
    }

    const sportLevels = sportRows.filter((sport) => sport.userId === row.userId);
    const averageSportLevel =
      sportLevels.length > 0
        ? Math.round(
            sportLevels.reduce((total, sport) => total + (sport.level ?? 3), 0) /
              sportLevels.length,
          )
        : (row.skillLevel ?? 3);

    return [
      {
        userId: row.userId,
        demoRunId: row.demoRunId,
        sportPrefs,
        city: row.city,
        lat,
        lng,
        maxDistanceKm: row.responseMaxDistanceKm ?? row.userMaxDistanceKm,
        skillLevel: averageSportLevel,
        respondedAt: row.respondedAt,
      },
    ];
  });
}

async function insertDraftGroup(
  db: QueryExecutor,
  promptId: string,
  draft: FormedGroupDraft,
): Promise<MatchedGroupSummary> {
  const demoRunId = draft.members.find((member) => member.demoRunId)?.demoRunId ?? null;
  const [group] = await db
    .insert(groups)
    .values({
      demoRunId,
      promptId,
      sport: draft.sport,
      city: draft.city,
      centerLat: draft.centerLat.toFixed(6),
      centerLng: draft.centerLng.toFixed(6),
      sizeTarget: draft.sizeTarget,
      captainUserId: draft.captainUserId,
    })
    .returning({
      id: groups.id,
      sport: groups.sport,
      captainUserId: groups.captainUserId,
    });

  if (!group) {
    throw new Error("Group insert returned no row");
  }

  await db.insert(groupMembers).values(
    draft.members.map((member) => ({
      demoRunId: member.demoRunId,
      groupId: group.id,
      promptId,
      userId: member.userId,
      role: member.role,
    })),
  );

  return {
    id: group.id,
    sport: group.sport as SportKey,
    captainUserId: group.captainUserId,
    memberUserIds: draft.members.map((member) => member.userId),
  };
}

async function markMatchAttempts(
  db: QueryExecutor,
  promptId: string,
  candidates: MatchCandidate[],
  matchedUserIds: Set<string>,
) {
  const attemptedAt = new Date();

  for (const candidate of candidates) {
    await db
      .update(availabilityResponses)
      .set({
        lastMatchAttemptAt: attemptedAt,
        matchFailureReason: matchedUserIds.has(candidate.userId) ? null : "no_compatible_group",
      })
      .where(
        and(
          eq(availabilityResponses.promptId, promptId),
          eq(availabilityResponses.userId, candidate.userId),
        ),
      );
  }
}

export async function formGroupsForPromptAction(input: {
  promptId: string;
}): Promise<ActionResult<{ groups: MatchedGroupSummary[] }>> {
  return getDb().transaction(async (tx) => {
    const [prompt] = await tx
      .select({ id: prompts.id })
      .from(prompts)
      .where(eq(prompts.id, input.promptId))
      .limit(1);

    if (!prompt) {
      return actionError("not_found");
    }

    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${input.promptId}))`);

    const existing = await existingGroupsForPrompt(tx, input.promptId);
    const candidates = await candidatesForPrompt(tx, input.promptId);
    const drafts = formDeterministicGroups(candidates);
    const inserted = [];

    for (const draft of drafts) {
      inserted.push(await insertDraftGroup(tx, input.promptId, draft));
    }

    const matchedUserIds = new Set(
      [...existing, ...inserted].flatMap((group) => group.memberUserIds),
    );
    await markMatchAttempts(tx, input.promptId, candidates, matchedUserIds);

    return actionOk({ groups: [...existing, ...inserted] });
  });
}
