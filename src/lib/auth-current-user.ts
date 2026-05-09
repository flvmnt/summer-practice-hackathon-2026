import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { clearSession, getSession } from "@/lib/session";

export type CurrentUser = {
  id: string;
  username: string;
  fullName: string;
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
      isAdmin: users.isAdmin,
      locale: users.locale,
      bannedAt: users.bannedAt,
      deletedAt: users.deletedAt,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user || user.bannedAt || user.deletedAt) {
    await clearSession();
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    isAdmin: user.isAdmin,
    locale: user.locale === "en" ? "en" : "ro",
  };
}
