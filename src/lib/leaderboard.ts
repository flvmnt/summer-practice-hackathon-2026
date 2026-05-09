"use server";

import { and, desc, eq, gte, inArray, lt, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { achievements, eventAttendees, events, users } from "@/db/schema";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth-current-user";
import { getSession } from "@/lib/session";

export type LeaderboardRow = {
  rank: number;
  userId: string;
  username: string;
  fullName: string;
  points: number;
  attendedCount: number;
  streak: number;
};

export type LeaderboardData = {
  rows: LeaderboardRow[];
  viewer: { userId: string; rank: number; row: LeaderboardRow } | null;
};

const inputSchema = z
  .object({
    scope: z.enum(["week", "all"]).optional(),
  })
  .optional();

const TOP_N = 25;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function isoWeekKey(d: Date) {
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${utc.getUTCFullYear()}-${String(weekNo).padStart(2, "0")}`;
}

function computeStreak(dates: Date[], now: Date): number {
  if (dates.length === 0) return 0;
  const weeks = new Set(dates.map((d) => isoWeekKey(d)));
  let streak = 0;
  let cursor = new Date(now);
  const currentKey = isoWeekKey(cursor);
  if (!weeks.has(currentKey)) {
    cursor = new Date(cursor.getTime() - WEEK_MS);
    if (!weeks.has(isoWeekKey(cursor))) {
      return 0;
    }
  }
  while (weeks.has(isoWeekKey(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - WEEK_MS);
  }
  return streak;
}

async function viewerDemoRunId(): Promise<string | null> {
  const session = await getSession();
  if (!session.userId) return null;
  const [row] = await getDb()
    .select({ demoRunId: users.demoRunId })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);
  return row?.demoRunId ?? null;
}

export async function getLeaderboardAction(
  options?: { scope?: "week" | "all" },
): Promise<ActionResult<LeaderboardData>> {
  const parsed = inputSchema.safeParse(options);
  if (!parsed.success) {
    return actionError("validation");
  }
  const scope = parsed.data?.scope ?? "all";

  const viewer = await getCurrentUser();
  const demoRunId = await viewerDemoRunId();
  const db = getDb();
  const now = new Date();
  const weekStart = new Date(now.getTime() - WEEK_MS);

  const userScope = demoRunId
    ? eq(users.demoRunId, demoRunId)
    : isNull(users.demoRunId);
  const achievementScope = demoRunId
    ? eq(achievements.demoRunId, demoRunId)
    : isNull(achievements.demoRunId);
  const eventScope = demoRunId
    ? eq(events.demoRunId, demoRunId)
    : isNull(events.demoRunId);

  const achievementWhere =
    scope === "week"
      ? and(achievementScope, gte(achievements.awardedAt, weekStart))
      : achievementScope;

  const pointsRows = await db
    .select({
      userId: achievements.userId,
      points: sql<number>`count(*)::int`,
    })
    .from(achievements)
    .where(achievementWhere)
    .groupBy(achievements.userId);

  const attendedWhere =
    scope === "week"
      ? and(eventScope, eq(eventAttendees.status, "going"), lt(events.whenAt, now), gte(events.whenAt, weekStart))
      : and(eventScope, eq(eventAttendees.status, "going"), lt(events.whenAt, now));

  const attendedRows = await db
    .select({
      userId: eventAttendees.userId,
      attendedCount: sql<number>`count(*)::int`,
    })
    .from(eventAttendees)
    .innerJoin(events, eq(events.id, eventAttendees.eventId))
    .where(attendedWhere)
    .groupBy(eventAttendees.userId);

  const pointsByUser = new Map<string, number>();
  for (const row of pointsRows) {
    pointsByUser.set(row.userId, row.points);
  }
  const attendedByUser = new Map<string, number>();
  for (const row of attendedRows) {
    attendedByUser.set(row.userId, row.attendedCount);
  }

  const candidateIds = new Set<string>([
    ...pointsByUser.keys(),
    ...attendedByUser.keys(),
  ]);
  if (viewer) candidateIds.add(viewer.id);

  if (candidateIds.size === 0) {
    return actionOk({ rows: [], viewer: null });
  }

  const userRows = await db
    .select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
    })
    .from(users)
    .where(
      and(
        userScope,
        isNull(users.bannedAt),
        isNull(users.deletedAt),
        inArray(users.id, Array.from(candidateIds)),
      ),
    );

  const merged = userRows.map((u) => ({
    userId: u.id,
    username: u.username,
    fullName: u.fullName,
    points: pointsByUser.get(u.id) ?? 0,
    attendedCount: attendedByUser.get(u.id) ?? 0,
  }));

  merged.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.attendedCount !== a.attendedCount) return b.attendedCount - a.attendedCount;
    return a.username.localeCompare(b.username);
  });

  const fullRanked = merged.map((m, i) => ({ ...m, rank: i + 1 }));
  const topSlice = fullRanked.slice(0, TOP_N);
  const viewerEntry = viewer ? fullRanked.find((r) => r.userId === viewer.id) ?? null : null;

  const streakIds = new Set<string>(topSlice.map((r) => r.userId));
  if (viewerEntry) streakIds.add(viewerEntry.userId);

  const streakByUser = new Map<string, number>();
  if (streakIds.size > 0) {
    const dateRows = await db
      .select({
        userId: eventAttendees.userId,
        whenAt: events.whenAt,
      })
      .from(eventAttendees)
      .innerJoin(events, eq(events.id, eventAttendees.eventId))
      .where(
        and(
          eventScope,
          eq(eventAttendees.status, "going"),
          lt(events.whenAt, now),
          inArray(eventAttendees.userId, Array.from(streakIds)),
        ),
      )
      .orderBy(desc(events.whenAt));

    const datesByUser = new Map<string, Date[]>();
    for (const row of dateRows) {
      const list = datesByUser.get(row.userId) ?? [];
      list.push(row.whenAt);
      datesByUser.set(row.userId, list);
    }
    for (const id of streakIds) {
      streakByUser.set(id, computeStreak(datesByUser.get(id) ?? [], now));
    }
  }

  const rows: LeaderboardRow[] = topSlice.map((r) => ({
    rank: r.rank,
    userId: r.userId,
    username: r.username,
    fullName: r.fullName,
    points: r.points,
    attendedCount: r.attendedCount,
    streak: streakByUser.get(r.userId) ?? 0,
  }));

  const viewerOut = viewerEntry
    ? {
        userId: viewerEntry.userId,
        rank: viewerEntry.rank,
        row: {
          rank: viewerEntry.rank,
          userId: viewerEntry.userId,
          username: viewerEntry.username,
          fullName: viewerEntry.fullName,
          points: viewerEntry.points,
          attendedCount: viewerEntry.attendedCount,
          streak: streakByUser.get(viewerEntry.userId) ?? 0,
        },
      }
    : null;

  return actionOk({ rows, viewer: viewerOut });
}
