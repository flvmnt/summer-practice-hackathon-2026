"use server";

import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { userSports, users } from "@/db/schema";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import {
  onboardingProfileInputSchema,
  type OnboardingProfileInput,
} from "@/lib/contracts/auth";
import {
  onboardingLocationInputSchema,
  setUserSportsInputSchema,
  type OnboardingLocationInput,
  type SetUserSportsInput,
} from "@/lib/contracts/profile";
import { clearSession, getSession, saveUserSession } from "@/lib/session";

export async function updateOnboardingProfileAction(
  input: OnboardingProfileInput,
): Promise<ActionResult> {
  const parsed = onboardingProfileInputSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = parsed.error.issues.reduce<Record<string, string>>((acc, issue) => {
      const field = issue.path[0];
      if (typeof field === "string" && !acc[field]) {
        acc[field] = issue.message;
      }
      return acc;
    }, {});

    return actionError("validation", { fieldErrors });
  }

  const session = await getSession();
  if (!session.userId) {
    return actionError("unauthorized");
  }

  const [user] = await getDb()
    .update(users)
    .set({
      fullName: parsed.data.fullName,
      bio: parsed.data.bio,
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.userId))
    .returning({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      isAdmin: users.isAdmin,
      locale: users.locale,
      bannedAt: users.bannedAt,
      deletedAt: users.deletedAt,
    });

  if (!user || user.bannedAt || user.deletedAt) {
    await clearSession();
    return actionError("unauthorized");
  }

  await saveUserSession({
    userId: user.id,
    username: user.username,
    fullName: user.fullName,
    isAdmin: user.isAdmin,
    locale: user.locale === "en" ? "en" : "ro",
  });

  return actionOk();
}

export async function setUserSportsAction(input: SetUserSportsInput): Promise<ActionResult> {
  const parsed = setUserSportsInputSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("validation", {
      fieldErrors: { sports: parsed.error.issues[0]?.message ?? "sports_required" },
    });
  }

  const session = await getSession();
  if (!session.userId) {
    return actionError("unauthorized");
  }

  await getDb().transaction(async (tx) => {
    await tx.delete(userSports).where(eq(userSports.userId, session.userId!));
    await tx.insert(userSports).values(
      parsed.data.sports.map((entry) => ({
        userId: session.userId!,
        sport: entry.sport,
        level: entry.level,
      })),
    );
    await tx
      .update(users)
      .set({
        skillLevel: Math.round(
          parsed.data.sports.reduce((total, entry) => total + entry.level, 0) /
            parsed.data.sports.length,
        ),
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.userId!));
  });

  return actionOk();
}

export async function updateOnboardingLocationAction(
  input: OnboardingLocationInput,
): Promise<ActionResult> {
  const parsed = onboardingLocationInputSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = parsed.error.issues.reduce<Record<string, string>>((acc, issue) => {
      const field = issue.path[0];
      if (typeof field === "string" && !acc[field]) {
        acc[field] = issue.message;
      }
      return acc;
    }, {});

    return actionError("validation", { fieldErrors });
  }

  const session = await getSession();
  if (!session.userId) {
    return actionError("unauthorized");
  }

  const [user] = await getDb()
    .update(users)
    .set({
      city: parsed.data.city,
      homeLat: parsed.data.homeLat.toFixed(6),
      homeLng: parsed.data.homeLng.toFixed(6),
      maxDistanceKm: parsed.data.maxDistanceKm,
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.userId))
    .returning({
      id: users.id,
      bannedAt: users.bannedAt,
      deletedAt: users.deletedAt,
    });

  if (!user || user.bannedAt || user.deletedAt) {
    await clearSession();
    return actionError("unauthorized");
  }

  return actionOk();
}
