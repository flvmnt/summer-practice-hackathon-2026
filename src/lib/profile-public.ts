"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { achievements, userSports, users } from "@/db/schema";
import { scoreCompatibility } from "@/lib/ai/compat-score";
import { haversineKm } from "@/lib/matching-core";
import { SPORT_KEYS, type SportKey } from "@/lib/sports";

const usernameSchema = z
  .string()
  .min(3)
  .max(24)
  .regex(/^[a-z0-9_-]+$/);

export type PublicUserAchievement = {
  kind: string;
  count: number;
};

export type PublicUser = {
  id: string;
  username: string;
  fullName: string;
  city: string | null;
  bio: string | null;
  photoUrl?: string | null;
  sports: SportKey[];
  achievements: PublicUserAchievement[];
};

const SPORT_KEY_SET = new Set<string>(SPORT_KEYS);

export async function getPublicUserByUsername(
  username: string,
): Promise<PublicUser | null> {
  const parsed = usernameSchema.safeParse(username);
  if (!parsed.success) return null;

  const db = getDb();
  const [row] = await db
    .select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      city: users.city,
      bio: users.bio,
      photoUrl: users.photoUrl,
      profileVisibility: users.profileVisibility,
    })
    .from(users)
    .where(
      and(
        eq(users.username, parsed.data),
        isNull(users.bannedAt),
        isNull(users.deletedAt),
      ),
    )
    .limit(1);

  if (!row) return null;
  if (row.profileVisibility !== "public") return null;

  const sportRows = await db
    .select({ sport: userSports.sport })
    .from(userSports)
    .where(eq(userSports.userId, row.id));

  const sports = sportRows
    .map((entry) => entry.sport)
    .filter((sport): sport is SportKey => SPORT_KEY_SET.has(sport));

  const achievementRows = await db
    .select({
      kind: achievements.code,
      count: sql<number>`count(*)::int`,
    })
    .from(achievements)
    .where(eq(achievements.userId, row.id))
    .groupBy(achievements.code);

  return {
    id: row.id,
    username: row.username,
    fullName: row.fullName,
    city: row.city,
    bio: row.bio,
    photoUrl: row.photoUrl,
    sports,
    achievements: achievementRows.map((entry) => ({
      kind: entry.kind,
      count: entry.count,
    })),
  };
}

type CompatProfile = {
  id: string;
  sports: SportKey[];
  skillLevel: number | null;
  city: string | null;
  homeLat: string | null;
  homeLng: string | null;
  maxDistanceKm: number;
};

async function loadCompatProfile(userId: string): Promise<CompatProfile | null> {
  const db = getDb();
  const [user] = await db
    .select({
      id: users.id,
      city: users.city,
      homeLat: users.homeLat,
      homeLng: users.homeLng,
      maxDistanceKm: users.maxDistanceKm,
      skillLevel: users.skillLevel,
    })
    .from(users)
    .where(
      and(
        eq(users.id, userId),
        isNull(users.bannedAt),
        isNull(users.deletedAt),
      ),
    )
    .limit(1);

  if (!user) return null;

  const sportRows = await db
    .select({ sport: userSports.sport, level: userSports.level })
    .from(userSports)
    .where(eq(userSports.userId, user.id));

  const sports = sportRows
    .map((entry) => entry.sport)
    .filter((sport): sport is SportKey => SPORT_KEY_SET.has(sport));

  const avgLevel =
    sportRows.length > 0
      ? sportRows.reduce((total, entry) => total + (entry.level ?? 3), 0) /
        sportRows.length
      : null;

  return {
    id: user.id,
    sports,
    skillLevel: user.skillLevel ?? (avgLevel !== null ? Math.round(avgLevel) : null),
    city: user.city,
    homeLat: user.homeLat,
    homeLng: user.homeLng,
    maxDistanceKm: user.maxDistanceKm,
  };
}

function hasOnboardingSignal(profile: CompatProfile): boolean {
  return (
    profile.sports.length > 0 &&
    profile.skillLevel !== null &&
    profile.city !== null &&
    profile.homeLat !== null &&
    profile.homeLng !== null
  );
}

export async function getMatchPercentForViewer(
  viewerId: string,
  targetId: string,
): Promise<number | null> {
  if (viewerId === targetId) return null;

  const [viewer, target] = await Promise.all([
    loadCompatProfile(viewerId),
    loadCompatProfile(targetId),
  ]);

  if (!viewer || !target) return null;
  if (!hasOnboardingSignal(viewer) || !hasOnboardingSignal(target)) return null;

  const viewerLat = Number(viewer.homeLat);
  const viewerLng = Number(viewer.homeLng);
  const targetLat = Number(target.homeLat);
  const targetLng = Number(target.homeLng);

  if (
    !Number.isFinite(viewerLat) ||
    !Number.isFinite(viewerLng) ||
    !Number.isFinite(targetLat) ||
    !Number.isFinite(targetLng)
  ) {
    return null;
  }

  const distanceKm = haversineKm(
    { lat: viewerLat, lng: viewerLng },
    { lat: targetLat, lng: targetLng },
  );

  const result = await scoreCompatibility(
    {
      id: viewer.id,
      sports: viewer.sports,
      skillLevel: viewer.skillLevel ?? 3,
      city: viewer.city ?? "",
      distanceKm,
    },
    {
      id: target.id,
      sports: target.sports,
      skillLevel: target.skillLevel ?? 3,
      city: target.city ?? "",
      distanceKm,
    },
  );

  return Math.max(0, Math.min(100, Math.round(result.score)));
}
