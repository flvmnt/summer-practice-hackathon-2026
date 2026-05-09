import { NextResponse } from "next/server";
import {
  AUTH_RATE_LIMIT_POLICIES,
  checkAuthRateLimit,
  hashRateLimitParts,
  recordAuthFailure,
} from "@/lib/auth-rate-limit";
import {
  canReadDemoEndpoint,
  isDemoModeEnabled,
  isDemoSeedEnabled,
} from "@/lib/demo/guard";
import { getRequestIpFromHeaders } from "@/lib/request-ip";
import { seedDemo } from "../../../../../scripts/seed-demo";

export const dynamic = "force-dynamic";

const DEMO_RATE_LIMIT = {
  limit: 5,
  windowSeconds: AUTH_RATE_LIMIT_POLICIES.signupIp.windowSeconds,
} as const;

function demoBucket(action: "seed" | "reset", ip: string) {
  return `demo:${action}:ip:${hashRateLimitParts(ip)}`;
}

export async function POST(request: Request) {
  if (!isDemoModeEnabled() && !canReadDemoEndpoint(request)) {
    return NextResponse.json(
      { ok: false, error: "not_found" },
      { status: 404 },
    );
  }

  if (!isDemoSeedEnabled()) {
    return NextResponse.json(
      {
        ok: false,
        error: "demo_seed_disabled",
        note: "Set ALLOW_DEMO_SEED=true and DEMO_SEED_CONFIRM=showup2move to enable.",
      },
      { status: 403 },
    );
  }

  const ip = getRequestIpFromHeaders((name) => request.headers.get(name));
  const bucket = demoBucket("seed", ip);

  const status = await checkAuthRateLimit({ bucket, ...DEMO_RATE_LIMIT });
  if (status.limited) {
    return NextResponse.json(
      {
        ok: false,
        error: "rate_limited",
        retryAfterSeconds: status.retryAfterSeconds ?? 60,
      },
      { status: 429 },
    );
  }

  const recorded = await recordAuthFailure({ bucket, ...DEMO_RATE_LIMIT });
  if (recorded.limited) {
    return NextResponse.json(
      {
        ok: false,
        error: "rate_limited",
        retryAfterSeconds: recorded.retryAfterSeconds ?? 60,
      },
      { status: 429 },
    );
  }

  const result = await seedDemo();

  return NextResponse.json({
    ok: true,
    demoRunId: result.demoRunId,
    label: result.label,
    alreadySeeded: result.alreadySeeded,
    seeded: result.seeded,
  });
}
