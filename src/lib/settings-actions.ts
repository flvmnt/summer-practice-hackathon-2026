"use server";

import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth-current-user";
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
import {
  setUserSportsAction,
  updateOnboardingLocationAction,
  updateOnboardingProfileAction,
} from "@/lib/onboarding";
import { clearSession, getSession, saveUserSession } from "@/lib/session";

export const profileVisibilityInputSchema = z.object({
  isPublic: z.boolean(),
});

export type ProfileVisibilityInput = z.infer<typeof profileVisibilityInputSchema>;

function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  return error.issues.reduce<Record<string, string>>((acc, issue) => {
    const field = issue.path[0];
    if (typeof field === "string" && !acc[field]) {
      acc[field] = issue.message;
    }
    return acc;
  }, {});
}

export async function updateProfileBasicsAction(
  input: OnboardingProfileInput,
): Promise<ActionResult> {
  const parsed = onboardingProfileInputSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("validation", { fieldErrors: fieldErrorsFrom(parsed.error) });
  }

  const current = await getCurrentUser();
  if (!current) {
    return actionError("unauthorized");
  }

  return updateOnboardingProfileAction(parsed.data);
}

export async function updateSportsPrefsAction(
  input: SetUserSportsInput,
): Promise<ActionResult> {
  const parsed = setUserSportsInputSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("validation", {
      fieldErrors: { sports: parsed.error.issues[0]?.message ?? "sports_required" },
    });
  }

  const current = await getCurrentUser();
  if (!current) {
    return actionError("unauthorized");
  }

  return setUserSportsAction(parsed.data);
}

export async function updateLocationAction(
  input: OnboardingLocationInput,
): Promise<ActionResult> {
  const parsed = onboardingLocationInputSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("validation", { fieldErrors: fieldErrorsFrom(parsed.error) });
  }

  const current = await getCurrentUser();
  if (!current) {
    return actionError("unauthorized");
  }

  return updateOnboardingLocationAction(parsed.data);
}

export async function togglePublicVisibilityAction(
  input: ProfileVisibilityInput,
): Promise<ActionResult<{ isPublic: boolean }>> {
  const parsed = profileVisibilityInputSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("validation", { fieldErrors: fieldErrorsFrom(parsed.error) });
  }

  const session = await getSession();
  if (!session.userId) {
    return actionError("unauthorized");
  }

  const nextVisibility = parsed.data.isPublic ? "public" : "private";

  const [user] = await getDb()
    .update(users)
    .set({
      profileVisibility: nextVisibility,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(users.id, session.userId),
        isNull(users.bannedAt),
        isNull(users.deletedAt),
      ),
    )
    .returning({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      isAdmin: users.isAdmin,
      locale: users.locale,
      updatedAt: users.updatedAt,
      profileVisibility: users.profileVisibility,
    });

  if (!user) {
    await clearSession();
    return actionError("unauthorized");
  }

  await saveUserSession({
    userId: user.id,
    username: user.username,
    fullName: user.fullName,
    isAdmin: user.isAdmin,
    locale: user.locale === "en" ? "en" : "ro",
    userUpdatedAt: user.updatedAt.toISOString(),
  });

  return actionOk({ isPublic: user.profileVisibility === "public" });
}
