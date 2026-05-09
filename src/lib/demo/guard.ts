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

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) {
    return true;
  }

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function canMutateDemoEndpoint(request: Request) {
  const env = getServerEnv();
  return env.ALLOW_DEMO_MODE && isSameOrigin(request);
}

export function isDemoSeedEnabled() {
  const env = getServerEnv();
  return env.ALLOW_DEMO_SEED && env.DEMO_SEED_CONFIRM === "showup2move";
}
