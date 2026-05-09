import { NextResponse } from "next/server";
import { canReadDemoEndpoint } from "@/lib/demo/guard";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  if (!canReadDemoEndpoint(request)) {
    return NextResponse.json(
      { ok: false, error: "not_found" },
      { status: 404 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      rows: [
        {
          id: "phase-0-shell",
          label: "Deployable shell",
          status: "fallback",
          proof: "/api/health",
        },
      ],
      note: "Placeholder only. Later phases must replace this with rubric-row proof.",
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
