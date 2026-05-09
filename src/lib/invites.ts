"use server";

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { eventInvites, events, groups } from "@/db/schema";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import {
  AUTH_RATE_LIMIT_POLICIES,
  checkAuthRateLimit,
  invitePreviewIpBucket,
  inviteUserEventBucket,
  recordAuthFailure,
} from "@/lib/auth-rate-limit";
import { getCurrentUser } from "@/lib/auth-current-user";
import {
  eventInviteInputSchema,
  eventInviteTokenSchema,
  type EventInviteInput,
} from "@/lib/contracts/invite";
import { getRequestIp } from "@/lib/request-ip";
import type { SportKey } from "@/lib/sports";

export type CreatedInvite = {
  invitePath: string;
};

export type EventInvitePreview = {
  event: {
    title: string;
    sport: SportKey;
    status: string;
    whenAt: string;
    durationMin: number;
    customLocationText: string | null;
  };
  group: {
    city: string | null;
  } | null;
};

function hashSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

function newInviteToken(inviteId: string) {
  return `${inviteId}_${randomBytes(32).toString("base64url")}`;
}

function parseInviteToken(token: string) {
  const parsed = eventInviteTokenSchema.safeParse(token);
  if (!parsed.success) {
    return null;
  }

  const separatorIndex = parsed.data.indexOf("_");
  const inviteId = parsed.data.slice(0, separatorIndex);
  const secret = parsed.data.slice(separatorIndex + 1);
  if (!inviteId || !secret) {
    return null;
  }

  return { inviteId, secret };
}

async function requireEventOwner(eventId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const [event] = await getDb()
    .select({
      id: events.id,
      demoRunId: events.demoRunId,
      createdByUserId: events.createdByUserId,
    })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event || event.createdByUserId !== user.id) {
    return null;
  }

  return { user, event };
}

export async function createEventInviteAction(
  input: EventInviteInput,
): Promise<ActionResult<CreatedInvite>> {
  const parsed = eventInviteInputSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("validation");
  }

  const auth = await requireEventOwner(parsed.data.eventId);
  if (!auth) {
    return actionError("unauthorized");
  }

  const inviteId = randomUUID();
  const token = newInviteToken(inviteId);
  const secret = token.slice(token.indexOf("_") + 1);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const limit = await recordAuthFailure({
    bucket: inviteUserEventBucket(auth.user.id, auth.event.id),
    ...AUTH_RATE_LIMIT_POLICIES.inviteUserEvent,
  });
  if (limit.limited) {
    return actionError("rate_limited", { retryAfterSeconds: limit.retryAfterSeconds });
  }

  await getDb().transaction(async (tx) => {
    await tx
      .update(eventInvites)
      .set({ revokedAt: now })
      .where(
        and(
          eq(eventInvites.eventId, auth.event.id),
          isNull(eventInvites.revokedAt),
        ),
      );

    await tx.insert(eventInvites).values({
      id: inviteId,
      demoRunId: auth.event.demoRunId,
      eventId: auth.event.id,
      secretHash: hashSecret(secret),
      createdByUserId: auth.user.id,
      expiresAt,
    });
  });

  return actionOk({
    invitePath: `/${parsed.data.locale}/i/${token}`,
  });
}

export async function revokeEventInviteAction(
  input: EventInviteInput,
): Promise<ActionResult> {
  const parsed = eventInviteInputSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("validation");
  }

  const auth = await requireEventOwner(parsed.data.eventId);
  if (!auth) {
    return actionError("unauthorized");
  }

  await getDb()
    .update(eventInvites)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(eventInvites.eventId, auth.event.id),
        isNull(eventInvites.revokedAt),
      ),
    );

  return actionOk();
}

export async function getEventInvitePreview(
  token: string,
): Promise<EventInvitePreview | null> {
  const requestIp = await getRequestIp();
  const previewBucket = invitePreviewIpBucket(requestIp);
  const limit = await checkAuthRateLimit({
    bucket: previewBucket,
    ...AUTH_RATE_LIMIT_POLICIES.invitePreviewIp,
  });
  if (limit.limited) {
    return null;
  }

  const parsed = parseInviteToken(token);
  if (!parsed) {
    await recordAuthFailure({
      bucket: previewBucket,
      ...AUTH_RATE_LIMIT_POLICIES.invitePreviewIp,
    });
    return null;
  }

  const [preview] = await getDb()
    .select({
      title: events.title,
      sport: events.sport,
      status: events.status,
      whenAt: events.whenAt,
      durationMin: events.durationMin,
      customLocationText: events.customLocationText,
      city: groups.city,
    })
    .from(eventInvites)
    .innerJoin(events, eq(events.id, eventInvites.eventId))
    .leftJoin(groups, eq(groups.id, events.groupId))
    .where(
      and(
        eq(eventInvites.id, parsed.inviteId),
        eq(eventInvites.secretHash, hashSecret(parsed.secret)),
        isNull(eventInvites.revokedAt),
        gt(eventInvites.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!preview) {
    await recordAuthFailure({
      bucket: previewBucket,
      ...AUTH_RATE_LIMIT_POLICIES.invitePreviewIp,
    });
    return null;
  }

  return {
    event: {
      title: preview.title,
      sport: preview.sport as SportKey,
      status: preview.status,
      whenAt: preview.whenAt.toISOString(),
      durationMin: preview.durationMin,
      customLocationText: preview.customLocationText,
    },
    group: preview.city ? { city: preview.city } : null,
  };
}
