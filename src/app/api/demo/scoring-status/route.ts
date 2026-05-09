import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { canReadDemoEndpoint } from "@/lib/demo/guard";
import { getServerEnv } from "@/lib/env";
import { getHealthStatus } from "@/lib/health";
import {
  RUBRIC_CATEGORIES,
  RUBRIC_TOTAL_MAX,
  summarizeRubric,
} from "@/lib/demo/scoring-proofs";

export const dynamic = "force-dynamic";

type CountResult = { count: number };

async function safeCount(table: string): Promise<number> {
  try {
    const env = getServerEnv();
    if (!env.DATABASE_URL) return 0;
    const db = getDb();
    const rows = (await db.execute(
      sql.raw(`select count(*)::int as count from ${table}`),
    )) as unknown as CountResult[];
    return rows[0]?.count ?? 0;
  } catch {
    return 0;
  }
}

export async function GET(request: Request) {
  if (!canReadDemoEndpoint(request)) {
    return NextResponse.json(
      { ok: false, error: "not_found" },
      { status: 404 },
    );
  }

  const [health, users, groups, events, aiCache] = await Promise.all([
    getHealthStatus(),
    safeCount("users"),
    safeCount("groups"),
    safeCount("events"),
    safeCount("ai_cache"),
  ]);

  const summary = summarizeRubric();

  return NextResponse.json(
    {
      ok: true,
      data: {
        health: {
          db: health.db,
          commit: health.commit,
          version: health.version,
        },
        seed: {
          users,
          groups,
          events,
        },
        aiCache: {
          entries: aiCache,
        },
        rubric: {
          totalMax: RUBRIC_TOTAL_MAX,
          totalClaimed: summary.totalClaimed,
          byStatus: summary.byStatus,
          categories: RUBRIC_CATEGORIES,
        },
      },
      note: "Only rows marked live can be claimed without seed/fallback caveats.",
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
