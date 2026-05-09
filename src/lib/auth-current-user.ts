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
