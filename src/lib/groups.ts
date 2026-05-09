"use server";

import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { groupMembers, groups, users } from "@/db/schema";
import { type SportKey } from "@/lib/sports";

const SPORT_LABEL_EN: Record<SportKey, string> = {
  football: "Football",
  basketball: "Basketball",
  tennis: "Tennis",
  volleyball: "Volleyball",
  badminton: "Badminton",
  running: "Running",
  cycling: "Cycling",
  yoga: "Yoga",
  hiking: "Hiking",
  table_tennis: "Table tennis",
};

export type UserGroupListEntry = {
  id: string;
  sport: SportKey;
  isCaptain: boolean;
  memberCount: number;
  capacity: number;
  lastActivityAt: string;
  label: string;
  members: Array<{ userId: string; fullName: string }>;
};

export async function getUserGroupsList(
  userId: string,
): Promise<UserGroupListEntry[]> {
  const db = getDb();

  const myGroups = await db
    .select({
      groupId: groups.id,
      sport: groups.sport,
      sizeTarget: groups.sizeTarget,
      captainUserId: groups.captainUserId,
      status: groups.status,
      createdAt: groups.createdAt,
    })
    .from(groupMembers)
    .innerJoin(groups, eq(groups.id, groupMembers.groupId))
    .where(
      and(
        eq(groupMembers.userId, userId),
        eq(groupMembers.status, "confirmed"),
        eq(groups.status, "active"),
      ),
    )
    .orderBy(desc(groups.createdAt));

  if (myGroups.length === 0) {
    return [];
  }

  const groupIds = myGroups.map((g) => g.groupId);

  const memberRows = await db
    .select({
      groupId: groupMembers.groupId,
      userId: groupMembers.userId,
      fullName: users.fullName,
      joinedAt: groupMembers.joinedAt,
    })
    .from(groupMembers)
    .innerJoin(users, eq(users.id, groupMembers.userId))
    .where(
      and(
        inArray(groupMembers.groupId, groupIds),
        eq(groupMembers.status, "confirmed"),
        isNull(users.bannedAt),
        isNull(users.deletedAt),
      ),
    )
    .orderBy(asc(groupMembers.joinedAt));

  const byGroup = new Map<
    string,
    {
      members: Array<{ userId: string; fullName: string }>;
      lastJoinedAt: Date;
    }
  >();
  for (const row of memberRows) {
    const entry = byGroup.get(row.groupId) ?? {
      members: [],
      lastJoinedAt: row.joinedAt,
    };
    entry.members.push({ userId: row.userId, fullName: row.fullName });
    if (row.joinedAt.getTime() > entry.lastJoinedAt.getTime()) {
      entry.lastJoinedAt = row.joinedAt;
    }
    byGroup.set(row.groupId, entry);
  }

  const list: UserGroupListEntry[] = myGroups.map((g) => {
    const entry = byGroup.get(g.groupId);
    const members = entry?.members ?? [];
    const lastJoinedAt = entry?.lastJoinedAt ?? g.createdAt;
    const lastActivity =
      lastJoinedAt.getTime() > g.createdAt.getTime()
        ? lastJoinedAt
        : g.createdAt;
    const sport = g.sport as SportKey;
    return {
      id: g.groupId,
      sport,
      isCaptain: g.captainUserId === userId,
      memberCount: members.length,
      capacity: g.sizeTarget,
      lastActivityAt: lastActivity.toISOString(),
      label: SPORT_LABEL_EN[sport] ?? sport,
      members,
    };
  });

  list.sort(
    (a, b) =>
      new Date(b.lastActivityAt).getTime() -
      new Date(a.lastActivityAt).getTime(),
  );

  return list;
}
