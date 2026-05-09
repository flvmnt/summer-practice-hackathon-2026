"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import {
  checkAuthRateLimit,
  clearLoginFailures,
  clearRecoveryFailures,
  loginIpUserBucket,
  loginUserBucket,
  recordLoginFailure,
  recordRecoveryFailure,
  recoveryIpUserBucket,
  checkSignupAttempt,
  AUTH_RATE_LIMIT_POLICIES,
} from "@/lib/auth-rate-limit";
import {
  DUMMY_PASSWORD_HASH,
  DUMMY_RECOVERY_HASH,
  generateRecoveryCode,
  hashPassword,
  hashRecoveryCode,
  verifyPassword,
  verifyRecoveryCode,
} from "@/lib/auth-crypto";
import {
  loginInputSchema,
  recoverAccountInputSchema,
  signupInputSchema,
  type LoginInput,
  type RecoverAccountInput,
  type SignupInput,
} from "@/lib/contracts/auth";
import { getRequestIp } from "@/lib/request-ip";
import { clearSession, saveUserSession } from "@/lib/session";

type AuthUserRow = {
  id: string;
  username: string;
  fullName: string;
  passwordHash: string;
  recoveryCodeHash: string;
  isAdmin: boolean;
  locale: string;
  bannedAt: Date | null;
  deletedAt: Date | null;
  updatedAt: Date;
};

async function findUserByUsername(username: string): Promise<AuthUserRow | undefined> {
  const [user] = await getDb()
    .select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      passwordHash: users.passwordHash,
      recoveryCodeHash: users.recoveryCodeHash,
      isAdmin: users.isAdmin,
      locale: users.locale,
      bannedAt: users.bannedAt,
      deletedAt: users.deletedAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  return user;
}

function sessionUserFromRow(
  user: Pick<AuthUserRow, "id" | "username" | "fullName" | "isAdmin" | "locale" | "updatedAt">,
) {
  return {
    userId: user.id,
    username: user.username,
    fullName: user.fullName,
    isAdmin: user.isAdmin,
    locale: user.locale === "en" ? "en" as const : "ro" as const,
    userUpdatedAt: user.updatedAt.toISOString(),
  };
}

function rateLimited(retryAfterSeconds?: number) {
  return actionError("rate_limited", { retryAfterSeconds: retryAfterSeconds ?? 60 });
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

export async function signupAction(input: SignupInput): Promise<ActionResult<{ recoveryCode: string }>> {
  const parsed = signupInputSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("validation");
  }

  const ip = await getRequestIp();
  const signupLimit = await checkSignupAttempt(ip);
  if (signupLimit.limited) {
    return rateLimited(signupLimit.retryAfterSeconds);
  }

  const recoveryCode = generateRecoveryCode();
  const [passwordHash, recoveryCodeHash] = await Promise.all([
    hashPassword(parsed.data.password),
    hashRecoveryCode(recoveryCode),
  ]);

  try {
    const [user] = await getDb()
      .insert(users)
      .values({
        username: parsed.data.username,
        fullName: parsed.data.username,
        passwordHash,
        recoveryCodeHash,
        locale: parsed.data.locale,
      })
      .returning({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        isAdmin: users.isAdmin,
        locale: users.locale,
        updatedAt: users.updatedAt,
      });

    if (!user) {
      return actionError("internal");
    }

    await saveUserSession(sessionUserFromRow(user));
    return actionOk({ recoveryCode });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return actionError("validation", { fieldErrors: { username: "username_taken" } });
    }

    throw error;
  }
}

export async function loginAction(input: LoginInput): Promise<ActionResult> {
  const parsed = loginInputSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("validation");
  }

  const ip = await getRequestIp();
  const [ipLimit, userLimit] = await Promise.all([
    checkAuthRateLimit({
      bucket: loginIpUserBucket(ip, parsed.data.username),
      ...AUTH_RATE_LIMIT_POLICIES.loginIpUser,
    }),
    checkAuthRateLimit({
      bucket: loginUserBucket(parsed.data.username),
      ...AUTH_RATE_LIMIT_POLICIES.loginUser,
    }),
  ]);

  if (ipLimit.limited || userLimit.limited) {
    return rateLimited(ipLimit.retryAfterSeconds ?? userLimit.retryAfterSeconds);
  }

  const user = await findUserByUsername(parsed.data.username);
  const hash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
  const passwordValid = await verifyPassword(parsed.data.password, hash);

  if (!user || user.bannedAt || user.deletedAt || !passwordValid) {
    const failure = await recordLoginFailure(ip, parsed.data.username);
    if (failure.limited) {
      return rateLimited(failure.retryAfterSeconds);
    }

    return actionError("invalid_credentials");
  }

  await clearLoginFailures(ip, parsed.data.username);
  await saveUserSession(sessionUserFromRow(user));
  return actionOk();
}

export async function recoverAccountAction(
  input: RecoverAccountInput,
): Promise<ActionResult<{ newRecoveryCode: string }>> {
  const parsed = recoverAccountInputSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("validation");
  }

  const ip = await getRequestIp();
  const recoveryLimit = await checkAuthRateLimit({
    bucket: recoveryIpUserBucket(ip, parsed.data.username),
    ...AUTH_RATE_LIMIT_POLICIES.recoveryIpUser,
  });

  if (recoveryLimit.limited) {
    return rateLimited(recoveryLimit.retryAfterSeconds);
  }

  const user = await findUserByUsername(parsed.data.username);
  const recoveryHash = user?.recoveryCodeHash ?? DUMMY_RECOVERY_HASH;
  const recoveryValid = await verifyRecoveryCode(parsed.data.recoveryCode, recoveryHash);

  if (!user || user.bannedAt || user.deletedAt || !recoveryValid) {
    const failure = await recordRecoveryFailure(ip, parsed.data.username);
    if (failure.limited) {
      return rateLimited(failure.retryAfterSeconds);
    }

    return actionError("invalid_recovery");
  }

  const newRecoveryCode = generateRecoveryCode();
  const [passwordHash, recoveryCodeHash] = await Promise.all([
    hashPassword(parsed.data.newPassword),
    hashRecoveryCode(newRecoveryCode),
  ]);

  const [updatedUser] = await getDb()
    .update(users)
    .set({
      passwordHash,
      recoveryCodeHash,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))
    .returning({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      isAdmin: users.isAdmin,
      locale: users.locale,
      updatedAt: users.updatedAt,
    });

  if (!updatedUser) {
    return actionError("internal");
  }

  await clearRecoveryFailures(ip, parsed.data.username);
  await saveUserSession(sessionUserFromRow(updatedUser));
  return actionOk({ newRecoveryCode });
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}
