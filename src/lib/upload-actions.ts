"use server";

import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { profilePhotos, users } from "@/db/schema";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth-current-user";
import { saveUserSession } from "@/lib/session";
import { MAX_BYTES, uploadProfilePhoto } from "@/lib/uploads";

export type UploadProfilePhotoData = { photoUrl: string };

/**
 * Server action that accepts a `FormData` with a `photo` File field, validates
 * + re-encodes it via `uploadProfilePhoto`, writes the resulting object to R2,
 * persists the URL to `profile_photos`, and bumps `users.photo_url` so the
 * rest of the app can render it without an extra join.
 *
 * Returns the canonical action-result shape. Never throws across the boundary.
 */
export async function uploadProfilePhotoAction(
  formData: FormData,
): Promise<ActionResult<UploadProfilePhotoData>> {
  const user = await getCurrentUser();
  if (!user) {
    return actionError("unauthorized");
  }

  const raw = formData.get("photo");
  if (!raw || typeof raw === "string") {
    return actionError("validation", { fieldErrors: { photo: "photo_required" } });
  }

  // `File` extends `Blob` in modern Node; both expose `arrayBuffer`/`size`.
  const file = raw as Blob;
  if (file.size === 0) {
    return actionError("validation", { fieldErrors: { photo: "photo_required" } });
  }
  if (file.size > MAX_BYTES) {
    return actionError("too_large", { fieldErrors: { photo: "too_large" } });
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return actionError("upload_failed");
  }

  let uploaded: { key: string; url: string };
  try {
    uploaded = await uploadProfilePhoto(user.id, buffer);
  } catch (err) {
    const message = err instanceof Error ? err.message : "upload_failed";
    if (message === "too_large" || message === "unsupported_mime") {
      return actionError(message, { fieldErrors: { photo: message } });
    }
    return actionError("upload_failed");
  }

  try {
    const db = getDb();
    const updated = await db.transaction(async (tx) => {
      await tx.insert(profilePhotos).values({
        userId: user.id,
        url: uploaded.url,
        objectKey: uploaded.key,
      });

      const [row] = await tx
        .update(users)
        .set({
          photoUrl: uploaded.url,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(users.id, user.id),
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
        });

      return row;
    });

    if (!updated) {
      return actionError("unauthorized");
    }

    // Keep the iron-session `userUpdatedAt` claim in lockstep with the row we
    // just bumped. Without this, `getCurrentUser` would clear the session on
    // the next request because the timestamps would diverge.
    await saveUserSession({
      userId: updated.id,
      username: updated.username,
      fullName: updated.fullName,
      isAdmin: updated.isAdmin,
      locale: updated.locale === "en" ? "en" : "ro",
      userUpdatedAt: updated.updatedAt.toISOString(),
    });
  } catch {
    return actionError("upload_failed");
  }

  return actionOk({ photoUrl: uploaded.url });
}
