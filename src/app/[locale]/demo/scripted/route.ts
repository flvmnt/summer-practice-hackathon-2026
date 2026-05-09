import { NextResponse, type NextRequest } from "next/server";
import { isDemoModeEnabled } from "@/lib/demo/guard";
import { startScriptedDemoSession } from "@/lib/demo/scripted-login";
import {
  WALKTHROUGH_COOKIE,
  WALKTHROUGH_COOKIE_MAX_AGE,
} from "@/lib/demo/walkthrough";
import { toPublicUrl } from "@/lib/public-url";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ locale: string }> },
) {
  const { locale } = await ctx.params;
  const safeLocale = locale === "en" ? "en" : "ro";

  if (!isDemoModeEnabled()) {
    return new NextResponse(null, { status: 404 });
  }

  const started = await startScriptedDemoSession();
  const target = started ? `/${safeLocale}/today` : `/${safeLocale}/login`;

  const response = NextResponse.redirect(toPublicUrl(target, request));
  if (started) {
    response.cookies.set(WALKTHROUGH_COOKIE, "1", {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: WALKTHROUGH_COOKIE_MAX_AGE,
    });
  }
  return response;
}
