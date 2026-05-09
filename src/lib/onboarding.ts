"use server";

import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import {
  onboardingProfileInputSchema,
  type OnboardingProfileInput,
} from "@/lib/contracts/auth";
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
