"use server";

import { extractSportsFromBio } from "@/lib/ai/bio-extract";
import { getCurrentUser } from "@/lib/auth-current-user";
import {
  AUTH_RATE_LIMIT_POLICIES,
  aiBioUserBucket,
  checkAuthRateLimit,
} from "@/lib/auth-rate-limit";
import type { SportSuggestion } from "@/lib/contracts/ai";
import { z } from "zod";

export type ExtractSportsActionResult =
  | { ok: false; error: "unauthorized" | "rate_limited"; retryAfterSeconds?: number }
  | {
      ok: true;
      suggestions: SportSuggestion[];
      source: "ai" | "fallback";
    };

export async function extractSportsForCurrentUserAction(): Promise<ExtractSportsActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "unauthorized" } as const;
  }

  const limit = await checkAuthRateLimit({
    bucket: aiBioUserBucket(user.id),
    ...AUTH_RATE_LIMIT_POLICIES.aiBioUser,
  });
  if (limit.limited) {
    return {
      ok: false,
      error: "rate_limited",
      retryAfterSeconds: limit.retryAfterSeconds,
    } as const;
  }

  const bio = user.bio?.trim() ?? "";
  if (!bio) {
    return { ok: true, suggestions: [], source: "fallback" } as const;
  }

  const { suggestions, source } = await extractSportsFromBio(bio);
  return { ok: true, suggestions, source } as const;
}

const extractSportsFromBioTextInputSchema = z.object({
  bio: z.string().trim().min(1).max(240),
});

export async function extractSportsFromBioTextAction(input: {
  bio: string;
}): Promise<ExtractSportsActionResult | { ok: false; error: "validation" }> {
  const parsed = extractSportsFromBioTextInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "validation" } as const;
  }

  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "unauthorized" } as const;
  }

  const limit = await checkAuthRateLimit({
    bucket: aiBioUserBucket(user.id),
    ...AUTH_RATE_LIMIT_POLICIES.aiBioUser,
  });
  if (limit.limited) {
    return {
      ok: false,
      error: "rate_limited",
      retryAfterSeconds: limit.retryAfterSeconds,
    } as const;
  }

  const { suggestions, source } = await extractSportsFromBio(parsed.data.bio);
  return { ok: true, suggestions, source } as const;
}
