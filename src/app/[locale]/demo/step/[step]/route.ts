import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db";
import { events, groupMembers } from "@/db/schema";
import { isDemoModeEnabled } from "@/lib/demo/guard";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Resolves a walkthrough step that depends on dynamic seed data
 * (a specific group or event) and redirects the visitor to the right route.
 *
 * Falls back to the closest static route if the dynamic entity is missing.
 */
export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ locale: string; step: string }> },
) {
  const { locale, step } = await ctx.params;
  const safeLocale = locale === "en" ? "en" : "ro";

  if (!isDemoModeEnabled()) {
    return new NextResponse(null, { status: 404 });
  }

  const session = await getSession();
  const userId = session.userId;
  if (!userId) {
    return NextResponse.redirect(
      new URL(`/${safeLocale}/login`, request.url),
    );
  }

  const db = getDb();
  const target = await resolveTarget(db, userId, step, safeLocale);
  return NextResponse.redirect(new URL(target, request.url));
}

async function resolveTarget(
  db: ReturnType<typeof getDb>,
  userId: string,
  step: string,
  locale: "en" | "ro",
): Promise<string> {
  if (step === "group") {
    const [row] = await db
      .select({ groupId: groupMembers.groupId })
      .from(groupMembers)
      .where(eq(groupMembers.userId, userId))
      .limit(1);
    return row ? `/${locale}/groups/${row.groupId}` : `/${locale}/groups`;
  }

  if (step === "event") {
    const [memberRow] = await db
      .select({ groupId: groupMembers.groupId })
      .from(groupMembers)
      .where(eq(groupMembers.userId, userId))
      .limit(1);

    if (memberRow) {
      const [eventRow] = await db
        .select({ id: events.id })
        .from(events)
        .where(eq(events.groupId, memberRow.groupId))
        .limit(1);
      if (eventRow) return `/${locale}/events/${eventRow.id}`;
      return `/${locale}/groups/${memberRow.groupId}`;
    }
    return `/${locale}/groups`;
  }

  return `/${locale}/today`;
}
