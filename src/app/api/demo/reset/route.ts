import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import {
  achievements,
  availabilityResponses,
  demoRuns,
  eventInvites,
  events,
  groupMembers,
  groups,
  messages,
  notifications,
  profilePhotos,
  prompts,
  userSports,
  users,
  venues,
  votes,
} from "@/db/schema";
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
import { DEMO_RUN_LABEL } from "../../../../../scripts/seed-demo";
import { getRequestIpFromHeaders } from "@/lib/request-ip";

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
        error: "demo_reset_disabled",
        note: "Set ALLOW_DEMO_SEED=true and DEMO_SEED_CONFIRM=showup2move to enable.",
      },
      { status: 403 },
    );
  }

  const ip = getRequestIpFromHeaders((name) => request.headers.get(name));
  const bucket = demoBucket("reset", ip);

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

  const url = new URL(request.url);
  const queryDemoRunId = url.searchParams.get("demoRunId");
  const headerDemoRunId = request.headers.get("x-demo-run-id");
  const requestedDemoRunId = queryDemoRunId ?? headerDemoRunId ?? null;

  const db = getDb();

  let demoRunId = requestedDemoRunId;
  if (!demoRunId) {
    const [row] = await db
      .select({ id: demoRuns.id })
      .from(demoRuns)
      .where(eq(demoRuns.label, DEMO_RUN_LABEL))
      .limit(1);
    demoRunId = row?.id ?? null;
  }

  if (!demoRunId) {
    return NextResponse.json({
      ok: true,
      demoRunId: null,
      deleted: { demoRun: 0 },
      note: "no active demo run found",
    });
  }

  const targetDemoRunId: string = demoRunId;

  const deleted = await db.transaction(async (tx) => {
    await tx.delete(messages).where(eq(messages.demoRunId, targetDemoRunId));
    await tx
      .delete(notifications)
      .where(eq(notifications.demoRunId, targetDemoRunId));
    await tx.delete(votes).where(eq(votes.demoRunId, targetDemoRunId));
    await tx
      .delete(eventInvites)
      .where(eq(eventInvites.demoRunId, targetDemoRunId));
    await tx.delete(events).where(eq(events.demoRunId, targetDemoRunId));
    await tx
      .delete(groupMembers)
      .where(eq(groupMembers.demoRunId, targetDemoRunId));
    await tx.delete(groups).where(eq(groups.demoRunId, targetDemoRunId));
    await tx
      .delete(availabilityResponses)
      .where(eq(availabilityResponses.demoRunId, targetDemoRunId));
    await tx.delete(prompts).where(eq(prompts.demoRunId, targetDemoRunId));
    await tx.delete(venues).where(eq(venues.demoRunId, targetDemoRunId));
    await tx
      .delete(achievements)
      .where(eq(achievements.demoRunId, targetDemoRunId));
    await tx
      .delete(profilePhotos)
      .where(eq(profilePhotos.demoRunId, targetDemoRunId));
    await tx.delete(userSports).where(eq(userSports.demoRunId, targetDemoRunId));
    await tx.delete(users).where(eq(users.demoRunId, targetDemoRunId));
    const [removed] = await tx
      .delete(demoRuns)
      .where(eq(demoRuns.id, targetDemoRunId))
      .returning({ id: demoRuns.id });
    return { demoRun: removed ? 1 : 0 };
  });

  return NextResponse.json({
    ok: true,
    demoRunId: targetDemoRunId,
    deleted,
  });
}
