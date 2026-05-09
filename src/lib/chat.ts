"use server";

import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import {
  achievements,
  eventAttendees,
  eventVenueCandidates,
  events,
  groupMembers,
  groups,
  messages,
  userSports,
  users,
  venues,
  voteChoices,
  votes,
} from "@/db/schema";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import {
  AUTH_RATE_LIMIT_POLICIES,
  chatUserEventBucket,
  chatUserGroupBucket,
  recordAuthFailure,
} from "@/lib/auth-rate-limit";
import { getCurrentUser } from "@/lib/auth-current-user";
import {
  loadGroupMessagesInputSchema,
  postEventMessageInputSchema,
  postGroupMessageInputSchema,
  type PostEventMessageInput,
  type PostGroupMessageInput,
} from "@/lib/contracts/chat";
import type { SportKey } from "@/lib/sports";

export type GroupMessage = {
  id: string;
  body: string;
  kind: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    fullName: string;
  } | null;
};

export type GroupDetails = {
  currentUserId: string;
  group: {
    id: string;
    sport: SportKey;
    status: string;
    sizeTarget: number;
    captainUserId: string | null;
  };
  members: Array<{
    userId: string;
    role: string;
    status: string;
    username: string;
    fullName: string;
    skillLevel: number;
  }>;
  messages: GroupMessage[];
  events: Array<{
    id: string;
    title: string;
    sport: SportKey;
    status: string;
    whenAt: string;
  }>;
  achievements: Array<{
    code: "first_match";
    awardedAt: string;
  }>;
};

export type EventDetails = {
  currentUserId: string;
  event: {
    id: string;
    groupId: string;
    title: string;
    sport: SportKey;
    status: string;
    whenAt: string;
    durationMin: number;
    customLocationText: string | null;
    createdByUserId: string | null;
  };
  attendees: Array<{
    userId: string;
    status: string;
    username: string;
    fullName: string;
  }>;
  messages: GroupMessage[];
  venueCandidates: Array<{
    optionIdx: number;
    venueId: string;
    name: string;
    address: string | null;
    lat: string;
    lng: string;
    distanceKm: string | null;
    priceTier: string;
    priceConfidence: string;
    reason: string | null;
    votes: number;
  }>;
  venueVote: {
    id: string;
    status: string;
    selectedOptionIdx: number | null;
  } | null;
};

async function requireGroupMember(groupId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const [membership] = await getDb()
    .select({
      groupId: groupMembers.groupId,
      role: groupMembers.role,
      status: groupMembers.status,
      demoRunId: groupMembers.demoRunId,
    })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, user.id),
        eq(groupMembers.status, "confirmed"),
      ),
    )
    .limit(1);

  return membership ? { user, membership } : null;
}

async function requireEventAttendee(eventId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const [attendee] = await getDb()
    .select({
      eventId: eventAttendees.eventId,
      status: eventAttendees.status,
      demoRunId: events.demoRunId,
    })
    .from(eventAttendees)
    .innerJoin(events, eq(events.id, eventAttendees.eventId))
    .where(
      and(
        eq(eventAttendees.eventId, eventId),
        eq(eventAttendees.userId, user.id),
        inArray(eventAttendees.status, ["going", "maybe"]),
      ),
    )
    .limit(1);

  return attendee ? { user, attendee } : null;
}

async function loadScopedMessages(input: {
  scopeType: "group" | "event";
  groupId?: string;
  eventId?: string;
  limit: number;
}): Promise<GroupMessage[]> {
  const rows = await getDb()
    .select({
      id: messages.id,
      body: messages.body,
      kind: messages.kind,
      createdAt: messages.createdAt,
      userId: users.id,
      username: users.username,
      fullName: users.fullName,
    })
    .from(messages)
    .leftJoin(users, eq(users.id, messages.userId))
    .where(
      and(
        eq(messages.scopeType, input.scopeType),
        input.scopeType === "group"
          ? eq(messages.groupId, input.groupId!)
          : eq(messages.eventId, input.eventId!),
        isNull(messages.deletedAt),
      ),
    )
    .orderBy(desc(messages.createdAt))
    .limit(input.limit);

  return rows.reverse().map((row) => ({
    id: row.id,
    body: row.body,
    kind: row.kind,
    createdAt: row.createdAt.toISOString(),
    user: row.userId
      ? {
          id: row.userId,
          username: row.username ?? "deleted",
          fullName: row.fullName ?? "Deleted user",
        }
      : null,
  }));
}

async function loadGroupMessages(groupId: string, limit: number): Promise<GroupMessage[]> {
  return loadScopedMessages({ scopeType: "group", groupId, limit });
}

async function loadEventMessages(eventId: string, limit: number): Promise<GroupMessage[]> {
  return loadScopedMessages({ scopeType: "event", eventId, limit });
}

export async function getGroupAction(input: {
  groupId: string;
}): Promise<ActionResult<GroupDetails>> {
  const parsed = loadGroupMessagesInputSchema.safeParse({
    groupId: input.groupId,
    limit: 30,
  });
  if (!parsed.success) {
    return actionError("validation");
  }

  const auth = await requireGroupMember(parsed.data.groupId);
  if (!auth) {
    return actionError("unauthorized");
  }

  const [group] = await getDb()
    .select({
      id: groups.id,
      sport: groups.sport,
      status: groups.status,
      sizeTarget: groups.sizeTarget,
      captainUserId: groups.captainUserId,
    })
    .from(groups)
    .where(eq(groups.id, parsed.data.groupId))
    .limit(1);

  if (!group) {
    return actionError("not_found");
  }

  const members = await getDb()
    .select({
      userId: groupMembers.userId,
      role: groupMembers.role,
      status: groupMembers.status,
      username: users.username,
      fullName: users.fullName,
      profileSkillLevel: users.skillLevel,
      sportSkillLevel: userSports.level,
    })
    .from(groupMembers)
    .innerJoin(users, eq(users.id, groupMembers.userId))
    .leftJoin(
      userSports,
      and(eq(userSports.userId, users.id), eq(userSports.sport, group.sport)),
    )
    .where(
      and(
        eq(groupMembers.groupId, parsed.data.groupId),
        eq(groupMembers.status, "confirmed"),
      ),
    );

  const groupEvents = await getDb()
    .select({
      id: events.id,
      title: events.title,
      sport: events.sport,
      status: events.status,
      whenAt: events.whenAt,
    })
    .from(events)
    .where(eq(events.groupId, parsed.data.groupId))
    .orderBy(desc(events.whenAt))
    .limit(3);

  const currentAchievements = await getDb()
    .select({
      code: achievements.code,
      awardedAt: achievements.awardedAt,
    })
    .from(achievements)
    .where(
      and(
        eq(achievements.userId, auth.user.id),
        eq(achievements.code, "first_match"),
      ),
    );

  return actionOk({
    currentUserId: auth.user.id,
    group: {
      id: group.id,
      sport: group.sport as SportKey,
      status: group.status,
      sizeTarget: group.sizeTarget,
      captainUserId: group.captainUserId,
    },
    members: members.map((member) => ({
      userId: member.userId,
      role: member.role,
      status: member.status,
      username: member.username,
      fullName: member.fullName,
      skillLevel: member.sportSkillLevel ?? member.profileSkillLevel ?? 3,
    })),
    messages: await loadGroupMessages(parsed.data.groupId, parsed.data.limit),
    events: groupEvents.map((event) => ({
      id: event.id,
      title: event.title,
      sport: event.sport as SportKey,
      status: event.status,
      whenAt: event.whenAt.toISOString(),
    })),
    achievements: currentAchievements.map((achievement) => ({
      code: "first_match",
      awardedAt: achievement.awardedAt.toISOString(),
    })),
  });
}

export async function getEventAction(input: {
  eventId: string;
}): Promise<ActionResult<EventDetails>> {
  const parsed = postEventMessageInputSchema.pick({ eventId: true }).safeParse(input);
  if (!parsed.success) {
    return actionError("validation");
  }

  const auth = await requireEventAttendee(parsed.data.eventId);
  if (!auth) {
    return actionError("unauthorized");
  }

  const [event] = await getDb()
    .select({
      id: events.id,
      groupId: events.groupId,
      title: events.title,
      sport: events.sport,
      status: events.status,
      whenAt: events.whenAt,
      durationMin: events.durationMin,
      customLocationText: events.customLocationText,
      createdByUserId: events.createdByUserId,
    })
    .from(events)
    .where(eq(events.id, parsed.data.eventId))
    .limit(1);

  if (!event) {
    return actionError("not_found");
  }

  const attendees = await getDb()
    .select({
      userId: eventAttendees.userId,
      status: eventAttendees.status,
      username: users.username,
      fullName: users.fullName,
    })
    .from(eventAttendees)
    .innerJoin(users, eq(users.id, eventAttendees.userId))
    .where(eq(eventAttendees.eventId, parsed.data.eventId));

  const candidates = await getDb()
    .select({
      venueId: venues.id,
      name: venues.name,
      address: venues.address,
      lat: venues.lat,
      lng: venues.lng,
      distanceKm: eventVenueCandidates.distanceKm,
      priceTier: venues.priceTier,
      priceConfidence: venues.priceConfidence,
      reason: eventVenueCandidates.reason,
      rank: eventVenueCandidates.rank,
    })
    .from(eventVenueCandidates)
    .innerJoin(venues, eq(venues.id, eventVenueCandidates.venueId))
    .where(eq(eventVenueCandidates.eventId, parsed.data.eventId))
    .orderBy(asc(eventVenueCandidates.rank));

  const [venueVote] = await getDb()
    .select({
      id: votes.id,
      status: votes.status,
    })
    .from(votes)
    .where(and(eq(votes.eventId, parsed.data.eventId), eq(votes.topic, "venue")))
    .limit(1);

  const choices = venueVote
    ? await getDb()
        .select({
          userId: voteChoices.userId,
          optionIdx: voteChoices.optionIdx,
        })
        .from(voteChoices)
        .where(eq(voteChoices.voteId, venueVote.id))
    : [];

  const voteCounts = new Map<number, number>();
  for (const choice of choices) {
    voteCounts.set(choice.optionIdx, (voteCounts.get(choice.optionIdx) ?? 0) + 1);
  }

  return actionOk({
    currentUserId: auth.user.id,
    event: {
      id: event.id,
      groupId: event.groupId,
      title: event.title,
      sport: event.sport as SportKey,
      status: event.status,
      whenAt: event.whenAt.toISOString(),
      durationMin: event.durationMin,
      customLocationText: event.customLocationText,
      createdByUserId: event.createdByUserId,
    },
    attendees,
    messages: await loadEventMessages(parsed.data.eventId, 30),
    venueCandidates: candidates.map((candidate, index) => ({
      optionIdx: index,
      venueId: candidate.venueId,
      name: candidate.name,
      address: candidate.address,
      lat: candidate.lat,
      lng: candidate.lng,
      distanceKm: candidate.distanceKm,
      priceTier: candidate.priceTier,
      priceConfidence: candidate.priceConfidence,
      reason: candidate.reason,
      votes: voteCounts.get(index) ?? 0,
    })),
    venueVote: venueVote
      ? {
          id: venueVote.id,
          status: venueVote.status,
          selectedOptionIdx:
            choices.find((choice) => choice.userId === auth.user.id)?.optionIdx ?? null,
        }
      : null,
  });
}

export async function postMessageAction(
  input: PostGroupMessageInput,
): Promise<ActionResult<{ message: GroupMessage }>> {
  const parsed = postGroupMessageInputSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("validation");
  }

  const auth = await requireGroupMember(parsed.data.groupId);
  if (!auth) {
    return actionError("unauthorized");
  }

  const limit = await recordAuthFailure({
    bucket: chatUserGroupBucket(auth.user.id, parsed.data.groupId),
    ...AUTH_RATE_LIMIT_POLICIES.chatUserGroup,
  });
  if (limit.limited) {
    return actionError("rate_limited", { retryAfterSeconds: limit.retryAfterSeconds });
  }

  const inserted = await getDb()
    .insert(messages)
    .values({
      demoRunId: auth.membership.demoRunId,
      scopeType: "group",
      groupId: parsed.data.groupId,
      userId: auth.user.id,
      clientId: parsed.data.clientId,
      kind: "text",
      body: parsed.data.body,
    })
    .onConflictDoNothing({
      target: [messages.userId, messages.clientId],
    })
    .returning({
      id: messages.id,
      body: messages.body,
      kind: messages.kind,
      createdAt: messages.createdAt,
    });

  const message = inserted[0];
  if (message) {
    return actionOk({
      message: {
        id: message.id,
        body: message.body,
        kind: message.kind,
        createdAt: message.createdAt.toISOString(),
        user: {
          id: auth.user.id,
          username: auth.user.username,
          fullName: auth.user.fullName,
        },
      },
    });
  }

  const [existing] = await getDb()
    .select({
      id: messages.id,
      body: messages.body,
      kind: messages.kind,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(
      and(
        eq(messages.userId, auth.user.id),
        eq(messages.clientId, parsed.data.clientId),
        eq(messages.scopeType, "group"),
        eq(messages.groupId, parsed.data.groupId),
      ),
    )
    .limit(1);

  if (!existing) {
    return actionError("internal");
  }

  return actionOk({
    message: {
      id: existing.id,
      body: existing.body,
      kind: existing.kind,
      createdAt: existing.createdAt.toISOString(),
      user: {
        id: auth.user.id,
        username: auth.user.username,
        fullName: auth.user.fullName,
      },
    },
  });
}

export async function postEventMessageAction(
  input: PostEventMessageInput,
): Promise<ActionResult<{ message: GroupMessage }>> {
  const parsed = postEventMessageInputSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("validation");
  }

  const auth = await requireEventAttendee(parsed.data.eventId);
  if (!auth) {
    return actionError("unauthorized");
  }

  const limit = await recordAuthFailure({
    bucket: chatUserEventBucket(auth.user.id, parsed.data.eventId),
    ...AUTH_RATE_LIMIT_POLICIES.chatUserGroup,
  });
  if (limit.limited) {
    return actionError("rate_limited", { retryAfterSeconds: limit.retryAfterSeconds });
  }

  const inserted = await getDb()
    .insert(messages)
    .values({
      demoRunId: auth.attendee.demoRunId,
      scopeType: "event",
      eventId: parsed.data.eventId,
      userId: auth.user.id,
      clientId: parsed.data.clientId,
      kind: "text",
      body: parsed.data.body,
    })
    .onConflictDoNothing({
      target: [messages.userId, messages.clientId],
    })
    .returning({
      id: messages.id,
      body: messages.body,
      kind: messages.kind,
      createdAt: messages.createdAt,
    });

  const message = inserted[0];
  if (message) {
    return actionOk({
      message: {
        id: message.id,
        body: message.body,
        kind: message.kind,
        createdAt: message.createdAt.toISOString(),
        user: {
          id: auth.user.id,
          username: auth.user.username,
          fullName: auth.user.fullName,
        },
      },
    });
  }

  const [existing] = await getDb()
    .select({
      id: messages.id,
      body: messages.body,
      kind: messages.kind,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(
      and(
        eq(messages.userId, auth.user.id),
        eq(messages.clientId, parsed.data.clientId),
        eq(messages.scopeType, "event"),
        eq(messages.eventId, parsed.data.eventId),
      ),
    )
    .limit(1);

  if (!existing) {
    return actionError("internal");
  }

  return actionOk({
    message: {
      id: existing.id,
      body: existing.body,
      kind: existing.kind,
      createdAt: existing.createdAt.toISOString(),
      user: {
        id: auth.user.id,
        username: auth.user.username,
        fullName: auth.user.fullName,
      },
    },
  });
}
