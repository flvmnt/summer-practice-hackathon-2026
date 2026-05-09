import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { saveUserSession } from "@/lib/session";
import { ensureDemoSeeded } from "./ensure-seeded";
import { isDemoModeEnabled } from "./guard";

const SCRIPTED_DEMO_USERNAME = "demo_alex";

/**
 * Sign the visitor in as the canonical scripted-demo user (demo_alex).
 *
 * Returns true if a session was created (caller should redirect to clean
 * the query param) and false otherwise. No-op when demo mode is off or the
 * demo user could not be located after seeding.
 */
export async function startScriptedDemoSession(): Promise<boolean> {
  if (!isDemoModeEnabled()) return false;

  await ensureDemoSeeded();

  const [user] = await getDb()
    .select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      isAdmin: users.isAdmin,
      locale: users.locale,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.username, SCRIPTED_DEMO_USERNAME))
    .limit(1);

  if (!user) return false;

  await saveUserSession({
    userId: user.id,
    username: user.username,
    fullName: user.fullName,
    isAdmin: user.isAdmin,
    locale: user.locale === "en" ? "en" : "ro",
    userUpdatedAt: user.updatedAt.toISOString(),
  });

  return true;
}
