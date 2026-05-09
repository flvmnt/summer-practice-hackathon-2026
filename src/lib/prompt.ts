"use server";

import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { availabilityResponses, groupMembers, groups, prompts, users } from "@/db/schema";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import {
  respondToPromptInputSchema,
  type PromptAnswer,
  type PromptSlot,
  type RespondToPromptInput,
} from "@/lib/contracts/prompt";
import { getCurrentUser } from "@/lib/auth-current-user";
import { formGroupsForPromptAction } from "@/lib/matching";
import { activePromptWindow } from "@/lib/prompt-window";
import type { SportKey } from "@/lib/sports";

export type TodayPrompt = {
  id: string;
  windowDate: string;
  windowSlot: PromptSlot;
  messageText: string | null;
};

export type TodayResponse = {
  answer: PromptAnswer;
  sportPrefs: SportKey[] | null;
  maxDistanceKm: number | null;
  matchFailureReason: string | null;
  lastMatchAttemptAt: Date | null;
};

export type TodayGroup = {
  id: string;
  sport: SportKey;
  captainUserId: string | null;
};

function defaultPromptMessage(slot: PromptSlot) {
  if (slot === "morning") {
    return "ShowUpToday? Morning groups are forming.";
  }

  if (slot === "afternoon") {
    return "ShowUpToday? Afternoon games are forming.";
  }

  return "ShowUpToday? Evening groups are forming.";
}

function promptFromRow(row: {
  id: string;
  windowDate: string;
  windowSlot: string;
  messageText: string | null;
}): TodayPrompt {
  return {
    id: row.id,
    windowDate: row.windowDate,
    windowSlot: row.windowSlot as PromptSlot,
    messageText: row.messageText,
  };
}

function promptScope(demoRunId: string | null) {
  return demoRunId ? `demo:${demoRunId}` : "prod";
}

export async function getOrCreateActivePromptAction(
  scope: { demoRunId?: string | null } = {},
): Promise<ActionResult<TodayPrompt>> {
  const window = activePromptWindow();
  const messageText = defaultPromptMessage(window.windowSlot);
  const demoRunId = scope.demoRunId ?? null;
  const scopeKey = promptScope(demoRunId);

  const inserted = await getDb()
    .insert(prompts)
    .values({
      demoRunId,
      scopeKey,
      windowDate: window.windowDate,
      windowSlot: window.windowSlot,
      messageText,
    })
    .onConflictDoNothing()
    .returning({
      id: prompts.id,
      windowDate: prompts.windowDate,
      windowSlot: prompts.windowSlot,
      messageText: prompts.messageText,
    });

  if (inserted[0]) {
    return actionOk(promptFromRow(inserted[0]));
  }

  const [existing] = await getDb()
    .select({
      id: prompts.id,
      windowDate: prompts.windowDate,
      windowSlot: prompts.windowSlot,
      messageText: prompts.messageText,
    })
    .from(prompts)
    .where(
      and(
        eq(prompts.scopeKey, scopeKey),
        eq(prompts.windowDate, window.windowDate),
        eq(prompts.windowSlot, window.windowSlot),
      ),
    )
    .limit(1);

  if (!existing) {
    return actionError("internal");
  }

  return actionOk(promptFromRow(existing));
}

async function currentUserId() {
  const user = await getCurrentUser();
  return user?.id ?? null;
}

async function loadActivePromptForResponse(promptId: string, demoRunId: string | null) {
  const window = activePromptWindow();
  const [prompt] = await getDb()
    .select({
      id: prompts.id,
      demoRunId: prompts.demoRunId,
      scopeKey: prompts.scopeKey,
      windowDate: prompts.windowDate,
      windowSlot: prompts.windowSlot,
    })
    .from(prompts)
    .where(eq(prompts.id, promptId))
    .limit(1);

  if (!prompt) {
    return null;
  }

  const sameWindow =
    prompt.windowDate === window.windowDate && prompt.windowSlot === window.windowSlot;
  const sameScope =
    demoRunId === null
      ? prompt.demoRunId === null && prompt.scopeKey === "prod"
      : prompt.demoRunId === demoRunId && prompt.scopeKey === promptScope(demoRunId);

  return sameWindow && sameScope ? prompt : null;
}

export async function respondToPromptAction(
  input: RespondToPromptInput,
): Promise<ActionResult<{ state: "matched" | "queued" | "no_match" | "unavailable"; group?: TodayGroup }>> {
  const parsed = respondToPromptInputSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("validation");
  }

  const userId = await currentUserId();
  if (!userId) {
    return actionError("unauthorized");
  }

  const [user] = await getDb()
    .select({
      id: users.id,
      demoRunId: users.demoRunId,
      homeLat: users.homeLat,
      homeLng: users.homeLng,
      maxDistanceKm: users.maxDistanceKm,
      bannedAt: users.bannedAt,
      deletedAt: users.deletedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || user.bannedAt || user.deletedAt) {
    return actionError("unauthorized");
  }

  const activePrompt = await loadActivePromptForResponse(parsed.data.promptId, user.demoRunId);
  if (!activePrompt) {
    return actionError("invalid_prompt");
  }

  const responseValues = {
    demoRunId: user.demoRunId,
    promptId: parsed.data.promptId,
    userId,
    answer: parsed.data.answer,
    sportPrefs: parsed.data.sportPrefs,
    lat: parsed.data.lat?.toFixed(6) ?? user.homeLat,
    lng: parsed.data.lng?.toFixed(6) ?? user.homeLng,
    maxDistanceKm: parsed.data.maxDistanceKm ?? user.maxDistanceKm,
    updatedAt: new Date(),
  };

  await getDb()
    .insert(availabilityResponses)
    .values(responseValues)
    .onConflictDoUpdate({
      target: [availabilityResponses.promptId, availabilityResponses.userId],
      set: responseValues,
    });

  if (parsed.data.answer === "no") {
    return actionOk({ state: "unavailable" });
  }

  const matchResult = await formGroupsForPromptAction({ promptId: parsed.data.promptId });
  if (!matchResult.ok) {
    return actionError(matchResult.error);
  }

  const matchedGroup = matchResult.data.groups.find((group) =>
    group.memberUserIds.includes(userId),
  );

  if (matchedGroup) {
    return actionOk({
      state: "matched",
      group: {
        id: matchedGroup.id,
        sport: matchedGroup.sport,
        captainUserId: matchedGroup.captainUserId,
      },
    });
  }

  return actionOk({ state: "no_match" });
}

export async function getMyTodayStateAction(): Promise<
  ActionResult<{ prompt: TodayPrompt; response: TodayResponse | null; group: TodayGroup | null }>
> {
  const userId = await currentUserId();
  if (!userId) {
    return actionError("unauthorized");
  }

  const [user] = await getDb()
    .select({ demoRunId: users.demoRunId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const promptResult = await getOrCreateActivePromptAction({
    demoRunId: user?.demoRunId ?? null,
  });
  if (!promptResult.ok) {
    return promptResult;
  }

  const [response] = await getDb()
    .select({
      answer: availabilityResponses.answer,
      sportPrefs: availabilityResponses.sportPrefs,
      maxDistanceKm: availabilityResponses.maxDistanceKm,
      matchFailureReason: availabilityResponses.matchFailureReason,
      lastMatchAttemptAt: availabilityResponses.lastMatchAttemptAt,
    })
    .from(availabilityResponses)
    .where(
      and(
        eq(availabilityResponses.promptId, promptResult.data.id),
        eq(availabilityResponses.userId, userId),
      ),
    )
    .limit(1);

  const [group] = await getDb()
    .select({
      id: groups.id,
      sport: groups.sport,
      captainUserId: groups.captainUserId,
    })
    .from(groupMembers)
    .innerJoin(groups, eq(groups.id, groupMembers.groupId))
    .where(
      and(
        eq(groupMembers.promptId, promptResult.data.id),
        eq(groupMembers.userId, userId),
      ),
    )
    .limit(1);

  return actionOk({
    prompt: promptResult.data,
    response: response
      ? {
          answer: response.answer as PromptAnswer,
          sportPrefs: response.sportPrefs as SportKey[] | null,
          maxDistanceKm: response.maxDistanceKm,
          matchFailureReason: response.matchFailureReason,
          lastMatchAttemptAt: response.lastMatchAttemptAt,
        }
      : null,
    group: group
      ? {
          id: group.id,
          sport: group.sport as SportKey,
          captainUserId: group.captainUserId,
        }
      : null,
  });
}
