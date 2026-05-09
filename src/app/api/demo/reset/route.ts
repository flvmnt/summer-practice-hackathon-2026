import { NextResponse } from "next/server";
import {
  canReadDemoEndpoint,
  isDemoModeEnabled,
  isDemoSeedEnabled,
} from "@/lib/demo/guard";

export const dynamic = "force-dynamic";

/**
 * POST /api/demo/reset
 *
 * Demo-only reset trigger. Allowed from the in-app /demo page (demo mode
 * enabled) or with the demo-mode secret header for external automation. Real
 * reset action must scope deletions by `demo_run_id` to avoid touching real
 * rows; until that landing, this route returns a 501 stub so judges see the
 * wiring gap instead of a false-success toast.
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
        error: "demo_reset_disabled",
        note: "Set ALLOW_DEMO_SEED=true and DEMO_SEED_CONFIRM=showup2move to enable.",
      },
      { status: 403 },
    );
  }

  return NextResponse.json(
    {
      ok: false,
      error: "demo_reset_action_not_wired",
      note: "demo_run_id-scoped reset action lands in Wave 3.",
    },
    { status: 501 },
  );
}
