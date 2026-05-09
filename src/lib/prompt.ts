"use server";

import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { availabilityResponses, prompts, users } from "@/db/schema";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import {
  respondToPromptInputSchema,
  type PromptAnswer,
  type PromptSlot,
  type RespondToPromptInput,
} from "@/lib/contracts/prompt";
import { activePromptWindow } from "@/lib/prompt-window";
import type { SportKey } from "@/lib/sports";
import { getSession } from "@/lib/session";

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

export async function getOrCreateActivePromptAction(): Promise<ActionResult<TodayPrompt>> {
  const window = activePromptWindow();
  const messageText = defaultPromptMessage(window.windowSlot);

  const inserted = await getDb()
    .insert(prompts)
    .values({
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
  const session = await getSession();
  return session.userId ?? null;
}

export async function respondToPromptAction(
  input: RespondToPromptInput,
): Promise<ActionResult<{ state: "queued" | "unavailable" }>> {
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

  return actionOk({ state: parsed.data.answer === "yes" ? "queued" : "unavailable" });
}

export async function getMyTodayStateAction(): Promise<
  ActionResult<{ prompt: TodayPrompt; response: TodayResponse | null }>
> {
  const userId = await currentUserId();
  if (!userId) {
    return actionError("unauthorized");
  }

  const promptResult = await getOrCreateActivePromptAction();
  if (!promptResult.ok) {
    return promptResult;
  }

  const [response] = await getDb()
    .select({
      answer: availabilityResponses.answer,
      sportPrefs: availabilityResponses.sportPrefs,
      maxDistanceKm: availabilityResponses.maxDistanceKm,
    })
    .from(availabilityResponses)
    .where(
      and(
        eq(availabilityResponses.promptId, promptResult.data.id),
        eq(availabilityResponses.userId, userId),
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
        }
      : null,
  });
}
