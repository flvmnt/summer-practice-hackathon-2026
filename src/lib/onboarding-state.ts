import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { userSports, users } from "@/db/schema";
import type { SportKey } from "@/lib/sports";
import { clearSession, getSession } from "@/lib/session";

export type OnboardingUserState = {
  id: string;
  username: string;
  fullName: string;
  bio: string | null;
  city: string | null;
  homeLat: string | null;
  homeLng: string | null;
  maxDistanceKm: number;
  sports: Array<{
    sport: SportKey;
    level: number;
  }>;
};

export async function getOnboardingUserState(): Promise<OnboardingUserState | null> {
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
      city: users.city,
      homeLat: users.homeLat,
      homeLng: users.homeLng,
      maxDistanceKm: users.maxDistanceKm,
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

  const sports = await getDb()
    .select({
      sport: userSports.sport,
      level: userSports.level,
    })
    .from(userSports)
    .where(eq(userSports.userId, user.id));

  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    bio: user.bio,
    city: user.city,
    homeLat: user.homeLat,
    homeLng: user.homeLng,
    maxDistanceKm: user.maxDistanceKm,
    sports: sports.map((entry) => ({
      sport: entry.sport as SportKey,
      level: entry.level ?? 3,
    })),
  };
}
