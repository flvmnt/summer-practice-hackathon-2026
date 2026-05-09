"use server";

import { extractSportsFromBio } from "@/lib/ai/bio-extract";
import { getCurrentUser } from "@/lib/auth-current-user";
import type { SportSuggestion } from "@/lib/contracts/ai";

export type ExtractSportsActionResult =
  | { ok: false; error: "unauthorized" }
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

  const bio = user.bio?.trim() ?? "";
  if (!bio) {
    return { ok: true, suggestions: [], source: "fallback" } as const;
  }

  const { suggestions, source } = await extractSportsFromBio(bio);
  return { ok: true, suggestions, source } as const;
}
