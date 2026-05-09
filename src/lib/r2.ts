import "server-only";
import { S3Client } from "@aws-sdk/client-s3";

let r2Client: S3Client | undefined;

/**
 * Returns the configured R2 (S3-compatible) client.
 *
 * Reads the five R2 env vars present in `.env.local` and Railway:
 *   - R2_ENDPOINT
 *   - R2_BUCKET
 *   - R2_ACCESS_KEY_ID
 *   - R2_SECRET_ACCESS_KEY
 *   - PUBLIC_UPLOAD_BASE_URL (consumed by the upload helper, not the client)
 *
 * R2 quirks:
 *   - region must be `"auto"`.
 *   - `forcePathStyle: true` avoids virtual-host bucket DNS that R2 doesn't serve.
 *
 * The client is cached as a lazy singleton so we don't rebuild signing material
 * on every request.
 */
export function getR2Client(): S3Client {
  if (r2Client) {
    return r2Client;
  }

  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 client is not configured: R2_ENDPOINT, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY are required",
    );
  }

  r2Client = new S3Client({
    region: "auto",
    endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return r2Client;
}

/**
 * Returns the configured R2 bucket name. Throws if missing so callers fail loud
 * before attempting an upload.
 */
export function getR2Bucket(): string {
  const bucket = process.env.R2_BUCKET;
  if (!bucket) {
    throw new Error("R2_BUCKET is required for uploads");
  }
  return bucket;
}

/**
 * Returns the public CDN base URL prefix for upload URLs. No trailing slash.
 */
export function getPublicUploadBaseUrl(): string {
  const base = process.env.PUBLIC_UPLOAD_BASE_URL;
  if (!base) {
    throw new Error("PUBLIC_UPLOAD_BASE_URL is required for uploads");
  }
  return base.replace(/\/+$/, "");
}
