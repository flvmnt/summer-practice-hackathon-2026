/**
 * Next.js boot hook. Validates server env vars once at startup so a
 * misconfigured deploy fails fast instead of crashing on the first
 * request that needs DATABASE_URL or SESSION_SECRET.
 *
 * Only runs on the Node.js runtime; Edge worker requests skip this.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }
  const { getServerEnv } = await import("@/lib/env");
  try {
    getServerEnv();
  } catch (err) {
    console.error("[instrumentation] env validation failed at boot");
    throw err;
  }
}
