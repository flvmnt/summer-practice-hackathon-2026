"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { events, groupMembers, groups, messages, users } from "@/db/schema";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth-current-user";
import {
  AUTH_RATE_LIMIT_POLICIES,
  checkAuthRateLimit,
  manualEventUserBucket,
} from "@/lib/auth-rate-limit";
import { getOrCreateActivePromptAction } from "@/lib/prompt";
import { SPORT_KEYS, type SportKey } from "@/lib/sports";

const SPORT_ENUM = z.enum(SPORT_KEYS);

const createManualEventInputSchema = z.object({
  sport: SPORT_ENUM,
  whenAt: z.string().min(1).max(40),
  customLocationText: z.string().min(1).max(160).nullable().optional(),
  title: z.string().min(1).max(120).optional(),
});

export type CreateManualEventInput = z.infer<typeof createManualEventInputSchema>;

export type CreatedManualEvent = {
  event: { id: string; title: string; whenAt: string };
  groupId: string;
};

const SPORT_TITLE: Record<"en" | "ro", Record<SportKey, string>> = {
  en: {
    football: "Football match",
    basketball: "Basketball pickup",
    tennis: "Tennis match",
    volleyball: "Volleyball match",
    badminton: "Badminton match",
    running: "Group run",
    cycling: "Group ride",
    yoga: "Yoga session",
    hiking: "Hiking trip",
    table_tennis: "Table tennis match",
  },
  ro: {
    football: "Meci de fotbal",
    basketball: "Pickup baschet",
    tennis: "Meci de tenis",
    volleyball: "Meci de volei",
    badminton: "Meci de badminton",
    running: "Alergare în grup",
    cycling: "Tură cu bicicleta",
    yoga: "Sesiune yoga",
    hiking: "Drumeție",
    table_tennis: "Meci de tenis de masă",
  },
};

/**
 * Create a manual event without going through the matching/group flow.
 *
 * AGENTS.md says events must hang off a group, and the schema enforces
 * groupId NOT NULL plus a 1-captain-per-group unique index. We satisfy
 * both by auto-creating a single-member group with the caller as captain
 * before inserting the event, all in one transaction.
 */
export async function createManualEventAction(
  input: CreateManualEventInput,
): Promise<ActionResult<CreatedManualEvent>> {
  const parsed = createManualEventInputSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("validation");
  }

  const user = await getCurrentUser();
  if (!user) {
    return actionError("unauthorized");
  }

  const limit = await checkAuthRateLimit({
    bucket: manualEventUserBucket(user.id),
    ...AUTH_RATE_LIMIT_POLICIES.manualEventUser,
  });
  if (limit.limited) {
    return actionError("rate_limited", {
      retryAfterSeconds: limit.retryAfterSeconds,
    });
  }

  const whenAt = new Date(parsed.data.whenAt);
  if (Number.isNaN(whenAt.getTime())) {
    return actionError("validation");
  }

  const promptResult = await getOrCreateActivePromptAction();
  if (!promptResult.ok) {
    return actionError("internal");
  }
  const prompt = promptResult.data;

  const localeKey: "en" | "ro" = user.locale === "en" ? "en" : "ro";
  const fallbackTitle = SPORT_TITLE[localeKey][parsed.data.sport];
  const title = parsed.data.title?.trim() || fallbackTitle;
  const db = getDb();
  const [profile] = await db
    .select({
      city: users.city,
      homeLat: users.homeLat,
      homeLng: users.homeLng,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  const created = await db.transaction(async (tx) => {
    const [group] = await tx
      .insert(groups)
      .values({
        promptId: prompt.id,
        sport: parsed.data.sport,
        city: profile?.city ?? null,
        centerLat: profile?.homeLat ?? null,
        centerLng: profile?.homeLng ?? null,
        sizeTarget: 4,
        status: "active",
        captainUserId: user.id,
      })
      .returning({ id: groups.id });

    if (!group) {
      throw new Error("group_insert_failed");
    }

    await tx.insert(groupMembers).values({
      groupId: group.id,
      promptId: prompt.id,
      userId: user.id,
      role: "captain",
      status: "confirmed",
    });

    const [event] = await tx
      .insert(events)
      .values({
        groupId: group.id,
        title,
        sport: parsed.data.sport,
        whenAt,
        durationMin: 90,
        customLocationText: parsed.data.customLocationText ?? null,
        status: "proposed",
        createdByUserId: user.id,
      })
      .returning({
        id: events.id,
        title: events.title,
        whenAt: events.whenAt,
      });

    if (!event) {
      throw new Error("event_insert_failed");
    }

    await tx.insert(messages).values({
      scopeType: "group",
      groupId: group.id,
      userId: user.id,
      kind: "event_proposed",
      body: title,
    });

    return { groupId: group.id, event };
  });

  return actionOk({
    groupId: created.groupId,
    event: {
      id: created.event.id,
      title: created.event.title,
      whenAt: created.event.whenAt.toISOString(),
    },
  });
}
