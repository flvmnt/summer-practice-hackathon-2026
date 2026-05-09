import { NextResponse, type NextRequest } from "next/server";
import { isDemoModeEnabled } from "@/lib/demo/guard";
import { startScriptedDemoSession } from "@/lib/demo/scripted-login";

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

  return NextResponse.redirect(new URL(target, request.url));
}
