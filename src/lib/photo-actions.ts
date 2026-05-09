"use server";

import { extractSportsFromPhoto } from "@/lib/ai/photo-extract";
import { getCurrentUser } from "@/lib/auth-current-user";
import type { SportSuggestion } from "@/lib/contracts/ai";
import { MAX_BYTES, sniffMime } from "@/lib/uploads";

export type ExtractPhotoSportsActionResult =
  | {
      ok: false;
      error:
        | "unauthorized"
        | "photo_required"
        | "too_large"
        | "unsupported_mime"
        | "read_failed";
    }
  | { ok: true; suggestions: SportSuggestion[]; source: "ai" | "fallback" };

export async function extractSportsFromPhotoAction(
  formData: FormData,
): Promise<ExtractPhotoSportsActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "unauthorized" };
  }

  const raw = formData.get("photo");
  if (!raw || typeof raw === "string") {
    return { ok: false, error: "photo_required" };
  }

  const file = raw as Blob;
  if (file.size === 0) {
    return { ok: false, error: "photo_required" };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "too_large" };
  }

  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await file.arrayBuffer());
  } catch {
    return { ok: false, error: "read_failed" };
  }

  const mime = sniffMime(bytes);
  if (!mime) {
    return { ok: false, error: "unsupported_mime" };
  }

  const { suggestions, source } = await extractSportsFromPhoto(mime, bytes);
  return { ok: true, suggestions, source };
}
