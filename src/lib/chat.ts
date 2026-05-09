"use server";

import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { groupMembers, groups, messages, users } from "@/db/schema";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import {
  AUTH_RATE_LIMIT_POLICIES,
  chatUserGroupBucket,
  recordAuthFailure,
} from "@/lib/auth-rate-limit";
import { getCurrentUser } from "@/lib/auth-current-user";
import {
  loadGroupMessagesInputSchema,
  postGroupMessageInputSchema,
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
  }>;
  messages: GroupMessage[];
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

async function loadGroupMessages(groupId: string, limit: number): Promise<GroupMessage[]> {
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
        eq(messages.scopeType, "group"),
        eq(messages.groupId, groupId),
        isNull(messages.deletedAt),
      ),
    )
    .orderBy(desc(messages.createdAt))
    .limit(limit);

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
    })
    .from(groupMembers)
    .innerJoin(users, eq(users.id, groupMembers.userId))
    .where(eq(groupMembers.groupId, parsed.data.groupId));

  return actionOk({
    group: {
      id: group.id,
      sport: group.sport as SportKey,
      status: group.status,
      sizeTarget: group.sizeTarget,
      captainUserId: group.captainUserId,
    },
    members,
    messages: await loadGroupMessages(parsed.data.groupId, parsed.data.limit),
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
