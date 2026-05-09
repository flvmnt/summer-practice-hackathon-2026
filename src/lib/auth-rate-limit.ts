import "server-only";
import { createHash } from "node:crypto";
import { getSqlClient } from "@/db";

export type AuthRateLimitRow = {
  failures: number;
  window_started_at: Date | string;
};

export type AuthRateLimitStatus = {
  limited: boolean;
  failures: number;
  retryAfterSeconds?: number;
};

export type AuthRateLimitOptions = {
  bucket: string;
  limit: number;
  windowSeconds: number;
  now?: Date;
};

export const AUTH_RATE_LIMIT_POLICIES = {
  loginIpUser: { limit: 5, windowSeconds: 15 * 60 },
  loginUser: { limit: 10, windowSeconds: 15 * 60 },
  signupIp: { limit: 10, windowSeconds: 60 * 60 },
  recoveryIpUser: { limit: 3, windowSeconds: 30 * 60 },
  chatUserGroup: { limit: 20, windowSeconds: 60 },
  inviteUserEvent: { limit: 6, windowSeconds: 60 * 60 },
  invitePreviewIp: { limit: 60, windowSeconds: 60 },
} as const;

function normalizePart(value: string) {
  return value.trim().toLowerCase();
}

export function hashRateLimitParts(...parts: string[]) {
  const hash = createHash("sha256");
  for (const part of parts) {
    hash.update(normalizePart(part));
    hash.update("\0");
  }

  return hash.digest("hex").slice(0, 32);
}

export function loginIpUserBucket(ip: string, username: string) {
  return `auth:login:ip_user:${hashRateLimitParts(ip, username)}`;
}

export function loginUserBucket(username: string) {
  return `auth:login:user:${normalizePart(username)}`;
}

export function signupIpBucket(ip: string) {
  return `auth:signup:ip:${hashRateLimitParts(ip)}`;
}

export function recoveryIpUserBucket(ip: string, username: string) {
  return `auth:recovery:ip_user:${hashRateLimitParts(ip, username)}`;
}

export function chatUserGroupBucket(userId: string, groupId: string) {
  return `chat:send:user_group:${hashRateLimitParts(userId, groupId)}`;
}

export function chatUserEventBucket(userId: string, eventId: string) {
  return `chat:send:user_event:${hashRateLimitParts(userId, eventId)}`;
}

export function inviteUserEventBucket(userId: string, eventId: string) {
  return `invite:create:user_event:${hashRateLimitParts(userId, eventId)}`;
}

export function invitePreviewIpBucket(ip: string) {
  return `invite:preview:ip:${hashRateLimitParts(ip)}`;
}

export function evaluateAuthRateLimit(
  row: AuthRateLimitRow | undefined,
  limit: number,
  windowSeconds: number,
  now = new Date(),
): AuthRateLimitStatus {
  if (!row) {
    return { limited: false, failures: 0 };
  }

  const windowStartedAt = new Date(row.window_started_at);
  const windowAgeSeconds = Math.floor((now.getTime() - windowStartedAt.getTime()) / 1000);

  if (windowAgeSeconds >= windowSeconds) {
    return { limited: false, failures: 0 };
  }

  if (row.failures >= limit) {
    return {
      limited: true,
      failures: row.failures,
      retryAfterSeconds: Math.max(1, windowSeconds - windowAgeSeconds),
    };
  }

  return { limited: false, failures: row.failures };
}

export async function checkAuthRateLimit({
  bucket,
  limit,
  windowSeconds,
  now = new Date(),
}: AuthRateLimitOptions): Promise<AuthRateLimitStatus> {
  const sql = getSqlClient();
  const [row] = await sql<AuthRateLimitRow[]>`
    select failures, window_started_at
    from auth_rate_limits
    where bucket = ${bucket}
  `;

  return evaluateAuthRateLimit(row, limit, windowSeconds, now);
}

export async function recordAuthFailure({
  bucket,
  limit,
  windowSeconds,
  now = new Date(),
}: AuthRateLimitOptions): Promise<AuthRateLimitStatus> {
  const sql = getSqlClient();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);
  const nowIso = now.toISOString();
  const windowStartIso = windowStart.toISOString();
  const [row] = await sql<AuthRateLimitRow[]>`
    insert into auth_rate_limits (bucket, window_started_at, failures)
    values (${bucket}, ${nowIso}::timestamptz, 1)
    on conflict (bucket) do update set
      window_started_at = case
        when auth_rate_limits.window_started_at <= ${windowStartIso}::timestamptz
        then ${nowIso}::timestamptz
        else auth_rate_limits.window_started_at
      end,
      failures = case
        when auth_rate_limits.window_started_at <= ${windowStartIso}::timestamptz
        then 1
        else auth_rate_limits.failures + 1
      end
    returning failures, window_started_at
  `;

  return evaluateAuthRateLimit(row, limit, windowSeconds, now);
}

export async function clearAuthFailures(bucket: string) {
  const sql = getSqlClient();
  await sql`
    delete from auth_rate_limits
    where bucket = ${bucket}
  `;
}

export async function recordLoginFailure(ip: string, username: string) {
  const [ipUserStatus, userStatus] = await Promise.all([
    recordAuthFailure({
      bucket: loginIpUserBucket(ip, username),
      ...AUTH_RATE_LIMIT_POLICIES.loginIpUser,
    }),
    recordAuthFailure({
      bucket: loginUserBucket(username),
      ...AUTH_RATE_LIMIT_POLICIES.loginUser,
    }),
  ]);

  return ipUserStatus.limited ? ipUserStatus : userStatus;
}

export async function clearLoginFailures(ip: string, username: string) {
  await Promise.all([
    clearAuthFailures(loginIpUserBucket(ip, username)),
    clearAuthFailures(loginUserBucket(username)),
  ]);
}

export function checkSignupAttempt(ip: string) {
  return recordAuthFailure({
    bucket: signupIpBucket(ip),
    ...AUTH_RATE_LIMIT_POLICIES.signupIp,
  });
}

export function recordRecoveryFailure(ip: string, username: string) {
  return recordAuthFailure({
    bucket: recoveryIpUserBucket(ip, username),
    ...AUTH_RATE_LIMIT_POLICIES.recoveryIpUser,
  });
}

export function clearRecoveryFailures(ip: string, username: string) {
  return clearAuthFailures(recoveryIpUserBucket(ip, username));
}
