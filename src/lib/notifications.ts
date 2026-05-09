import "server-only";
import { and, desc, eq, isNull, lt, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { notifications } from "@/db/schema";

export type Notification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: Date | null;
  createdAt: Date;
};

export type ListNotificationsOptions = {
  limit?: number;
  before?: Date;
};

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function clampLimit(value: number | undefined): number {
  if (!value || !Number.isFinite(value) || value <= 0) {
    return DEFAULT_LIMIT;
  }
  return Math.min(Math.floor(value), MAX_LIMIT);
}

/**
 * List notifications owned by `userId`, newest first. Optionally paginate by
 * passing the `createdAt` timestamp of the last item from the previous page
 * via `before`.
 */
export async function listNotifications(
  userId: string,
  opts: ListNotificationsOptions = {},
): Promise<Notification[]> {
  const limit = clampLimit(opts.limit);
  const conditions = [eq(notifications.userId, userId)];
  if (opts.before) {
    conditions.push(lt(notifications.createdAt, opts.before));
  }

  const rows = await getDb()
    .select({
      id: notifications.id,
      userId: notifications.userId,
      type: notifications.type,
      title: notifications.title,
      body: notifications.body,
      href: notifications.href,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt), desc(notifications.id))
    .limit(limit);

  return rows;
}

/**
 * Mark a single notification as read. Only succeeds when the row is owned by
 * `userId` and is currently unread; returns `true` when the row was updated.
 */
export async function markNotificationRead(
  userId: string,
  notificationId: string,
): Promise<boolean> {
  const updated = await getDb()
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId),
        isNull(notifications.readAt),
      ),
    )
    .returning({ id: notifications.id });

  return updated.length > 0;
}

/**
 * Mark every unread notification owned by `userId` as read. Returns the number
 * of rows updated.
 */
export async function markAllNotificationsRead(userId: string): Promise<number> {
  const updated = await getDb()
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
    .returning({ id: notifications.id });

  return updated.length;
}

/**
 * Count unread notifications owned by `userId`.
 */
export async function unreadCount(userId: string): Promise<number> {
  const [row] = await getDb()
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));

  return row?.count ?? 0;
}
