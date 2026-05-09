import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { clearSession, getSession } from "@/lib/session";

export type CurrentUser = {
  id: string;
  username: string;
  fullName: string;
  bio: string | null;
  isAdmin: boolean;
  locale: "ro" | "en";
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();

  if (!session.userId) {
    return null;
  }

  const [user] = await getDb()
    .select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      bio: users.bio,
      isAdmin: users.isAdmin,
      locale: users.locale,
      bannedAt: users.bannedAt,
      deletedAt: users.deletedAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user || user.bannedAt || user.deletedAt) {
    await clearSession();
    return null;
  }

  if (!session.userUpdatedAt || session.userUpdatedAt !== user.updatedAt.toISOString()) {
    await clearSession();
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    bio: user.bio,
    isAdmin: user.isAdmin,
    locale: user.locale === "en" ? "en" : "ro",
  };
}

export class UnauthorizedError extends Error {
  constructor() {
    super("unauthorized");
    this.name = "UnauthorizedError";
  }
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new UnauthorizedError();
  }
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (!user.isAdmin) {
    throw new UnauthorizedError();
  }
  return user;
}

/**
 * Discriminated-union variant of `requireUser` for server actions.
 *
 * `requireUser` throws on no-user, which would cross the server-action
 * boundary as an exception (forbidden by AGENTS.md). This helper resolves
 * to the canonical `{ ok: false, error: "unauthorized" }` shape so callers
 * can return it directly (custom-shape callers) or feed it to
 * `actionError(auth.error)` (standard `ActionResult` callers).
 *
 * The compile-time win: any future caller that forgets the null guard
 * gets a type error from the discriminated union, instead of silently
 * leaking `null` past `getCurrentUser()`.
 */
export type RequireUserForActionResult =
  | { ok: true; user: CurrentUser }
  | { ok: false; error: "unauthorized" };

export async function requireUserForAction(): Promise<RequireUserForActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "unauthorized" } as const;
  }
  return { ok: true, user } as const;
}
