import "server-only";
import { seedDemo } from "../../../scripts/seed-demo";
import { isDemoSeedEnabled } from "./guard";

let inflight: Promise<void> | null = null;
let lastError: unknown = null;

/**
 * Idempotent demo seeder. Call from any demo route to guarantee the demo
 * fixtures exist on first hit and skip work on subsequent ones.
 *
 * - No-op when ALLOW_DEMO_SEED / DEMO_SEED_CONFIRM are not configured.
 * - Per-process memoised: concurrent callers await one in-flight seedDemo().
 * - On failure, the next call retries (we do not poison the cache).
 */
export async function ensureDemoSeeded(): Promise<void> {
  if (!isDemoSeedEnabled()) return;
  if (inflight) return inflight;

  inflight = seedDemo()
    .then(() => {
      lastError = null;
    })
    .catch((err) => {
      lastError = err;
      inflight = null;
      throw err;
    });

  try {
    await inflight;
  } catch {
    /* swallowed - caller pages still render; logs surface the error */
  }
}

export function lastDemoSeedError(): unknown {
  return lastError;
}
