import "server-only";
import { timingSafeEqual } from "node:crypto";
import { getServerEnv } from "@/lib/env";

export function isDemoModeEnabled() {
  return getServerEnv().ALLOW_DEMO_MODE;
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function canReadDemoEndpoint(request: Request) {
  const env = getServerEnv();
  if (!env.ALLOW_DEMO_MODE) {
    return false;
  }

  if (!env.DEMO_MODE_SECRET) {
    return false;
  }

  const provided = request.headers.get("x-demo-mode-secret");
  return provided ? safeCompare(provided, env.DEMO_MODE_SECRET) : false;
}

export function isDemoSeedEnabled() {
  const env = getServerEnv();
  return env.ALLOW_DEMO_SEED && env.DEMO_SEED_CONFIRM === "showup2move";
}
