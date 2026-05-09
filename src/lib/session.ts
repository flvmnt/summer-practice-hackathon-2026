import "server-only";
import { getIronSession } from "iron-session";
import type { SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { getServerEnv } from "@/lib/env";
import type { AppLocale } from "@/i18n/routing";

export type SessionData = {
  userId?: string;
  username?: string;
  fullName?: string;
  isAdmin?: boolean;
  locale?: AppLocale;
};

const DEV_SESSION_SECRET =
  "dev-only-showup2move-session-secret-64-characters-minimum-value";

export function getSessionOptions(): SessionOptions {
  const env = getServerEnv();
  const password = env.SESSION_SECRET ?? DEV_SESSION_SECRET;

  if (env.NODE_ENV === "production" && !env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is required in production");
  }

  return {
    password,
    cookieName: "showup2move_session",
    cookieOptions: {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    },
  };
}

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), getSessionOptions());
}

export type SessionUser = Required<Pick<SessionData, "userId" | "username" | "isAdmin">> &
  Pick<SessionData, "fullName" | "locale">;

export async function saveUserSession(user: SessionUser) {
  const session = await getSession();
  session.userId = user.userId;
  session.username = user.username;
  session.fullName = user.fullName;
  session.isAdmin = user.isAdmin;
  session.locale = user.locale;
  await session.save();
}

export async function clearSession() {
  const session = await getSession();
  session.destroy();
}
