/**
 * Next.js boot hook. Validates server env vars once at startup so a
 * misconfigured deploy fails fast instead of crashing on the first
 * request that needs DATABASE_URL, SESSION_SECRET, or PUBLIC_BASE_URL.
 *
 * Behavior:
 * - Only runs on the Node.js runtime (Edge requests skip this).
 * - In production: re-throws so the deploy fails loudly.
 * - In development/test: logs a redacted summary and continues, so
 *   hot-reload loops don't crash the dev server.
 *
 * Redaction: we log only the names of the failing env keys. Values are
 * never logged (they may contain secrets like SESSION_SECRET).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }
  const { getServerEnv } = await import("@/lib/env");
  try {
    getServerEnv();
  } catch (err) {
    const failingKeys = extractFailingKeys(err);
    const summary = failingKeys.length > 0
      ? `invalid keys: ${failingKeys.join(", ")}`
      : "see error details";
    if (process.env.NODE_ENV === "production") {
      console.error(`[instrumentation] env validation failed at boot (${summary})`);
      throw err;
    }
    console.error(
      `[instrumentation] env validation failed at boot (${summary}); continuing in non-production`,
    );
  }
}

function extractFailingKeys(err: unknown): string[] {
  if (!err || typeof err !== "object") return [];
  const issues = (err as { issues?: Array<{ path?: Array<string | number> }> }).issues;
  if (!Array.isArray(issues)) return [];
  const keys = new Set<string>();
  for (const issue of issues) {
    const head = issue?.path?.[0];
    if (typeof head === "string" && head.length > 0) {
      keys.add(head);
    }
  }
  return Array.from(keys);
}
