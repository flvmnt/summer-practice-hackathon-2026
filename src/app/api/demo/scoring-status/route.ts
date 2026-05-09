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
          id: "foundation-shell",
          label: "Deployable shell",
          status: "live",
          proof: "/api/health",
        },
        {
          id: "auth",
          label: "Registration, login, and recovery routes",
          status: "fallback",
          proof: "/ro/signup",
        },
        {
          id: "profile-onboarding",
          label: "Profile, sports, skill, and location onboarding routes",
          status: "fallback",
          proof: "/ro/onboarding/profile",
        },
        {
          id: "show-up-today",
          label: "ShowUpToday availability and matching response path",
          status: "fallback",
          proof: "/ro/today",
        },
        {
          id: "matching-groups-chat-events",
          label: "Matching, groups, chat, events, maps, and votes",
          status: "missing",
          proof: "Not implemented yet",
        },
        {
          id: "ai-photo-upload",
          label: "Photo upload and AI assistance",
          status: "missing",
          proof: "Not implemented yet",
        },
      ],
      note: "Only rows marked live should be claimed during judging.",
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
