import { NextResponse } from "next/server";
import {
  canReadDemoEndpoint,
  isDemoModeEnabled,
  isDemoSeedEnabled,
} from "@/lib/demo/guard";

export const dynamic = "force-dynamic";

/**
 * POST /api/demo/seed
 *
 * Demo-only seed trigger. Allowed from the in-app /demo page (demo mode enabled)
 * or with the demo-mode secret header for external automation.
 *
 * The actual seed-action wiring lives in `scripts/seed-demo.ts` and a future
 * server action that owns demo-marked rows. Until that lands, this route
 * returns a 501 stub so the Judge Mode UI can surface the wiring gap honestly
 * instead of pretending to seed.
 */
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

  // Stub: real demo-seed action is not wired yet. Run `pnpm seed:demo` from CLI.
  return NextResponse.json(
    {
      ok: false,
      error: "demo_seed_action_not_wired",
      note: "Run `pnpm seed:demo` from the server until this action is wired.",
    },
    { status: 501 },
  );
}
