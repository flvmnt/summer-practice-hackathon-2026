import "server-only";
import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { getPublicUploadBaseUrl, getR2Bucket, getR2Client } from "@/lib/r2";

/** 8 MiB hard cap on raw uploaded bytes. */
export const MAX_BYTES = 8 * 1024 * 1024;

/** Sniff the MIME type of an image buffer from its magic bytes. */
export type SniffedMime = "image/png" | "image/jpeg" | "image/webp";

/**
 * Inspect the first bytes of `buffer` and return the detected image MIME type.
 *
 * Returns `null` for everything that isn't PNG, JPEG, or WEBP. We deliberately
 * do not trust the `File.type` the browser provides; magic bytes can't be
 * spoofed via a renamed extension.
 */
export function sniffMime(buffer: Uint8Array): SniffedMime | null {
  if (buffer.length < 12) {
    return null;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // WEBP: "RIFF" .... "WEBP"
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

export type ValidatedImage = {
  mime: SniffedMime;
  bytes: number;
};

/**
 * Validate the size and MIME of a raw uploaded image buffer.
 *
 * Throws an `Error` whose `message` is one of: `too_large`, `unsupported_mime`.
 * Callers should map these to user-facing copy.
 */
export function validateImage(buffer: Uint8Array): ValidatedImage {
  if (buffer.byteLength > MAX_BYTES) {
    throw new Error("too_large");
  }
  const mime = sniffMime(buffer);
  if (!mime) {
    throw new Error("unsupported_mime");
  }
  return { mime, bytes: buffer.byteLength };
}

/**
 * Re-encode a profile photo to a square 512x512 webp (quality 80) and strip
 * EXIF/ICC/XMP metadata. Returns the encoded buffer.
 *
 * Using sharp's default behavior for `.webp()` plus an explicit `withMetadata`
 * call with no args ensures no metadata travels with the image — important
 * because phone uploads commonly carry GPS EXIF.
 */
export async function reencodeProfilePhoto(buffer: Uint8Array): Promise<Buffer> {
  return sharp(buffer, { failOn: "truncated" })
    .rotate() // honor EXIF orientation before stripping it
    .resize(512, 512, { fit: "cover", position: "centre" })
    .webp({ quality: 80, effort: 4 })
    .toBuffer();
}

/**
 * Write a re-encoded profile photo to R2 under `profile/{userId}/{uuid}.webp`
 * and return both the storage key and the public URL.
 */
export async function writeToR2(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<{ key: string; url: string }> {
  const client = getR2Client();
  const bucket = getR2Bucket();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  const url = `${getPublicUploadBaseUrl()}/${key}`;
  return { key, url };
}

/**
 * Validate, re-encode, and upload a user's profile photo to R2.
 *
 * Returns the `{ key, url }` of the uploaded object. The caller is responsible
 * for persisting the URL to the `profile_photos` row + `users.photo_url`.
 *
 * Throws `Error("too_large")` or `Error("unsupported_mime")` from validation,
 * or rethrows underlying sharp/R2 failures.
 */
export async function uploadProfilePhoto(
  userId: string,
  buffer: Uint8Array,
): Promise<{ key: string; url: string }> {
  validateImage(buffer);
  const reencoded = await reencodeProfilePhoto(buffer);
  const key = `profile/${userId}/${randomUUID()}.webp`;
  return writeToR2(key, reencoded, "image/webp");
}
