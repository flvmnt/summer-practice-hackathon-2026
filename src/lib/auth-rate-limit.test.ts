import { describe, expect, it } from "vitest";
import {
  AUTH_RATE_LIMIT_POLICIES,
  chatUserEventBucket,
  chatUserGroupBucket,
  evaluateAuthRateLimit,
  hashRateLimitParts,
  invitePreviewIpBucket,
  inviteUserEventBucket,
  loginIpUserBucket,
  loginUserBucket,
  recoveryIpUserBucket,
  signupIpBucket,
} from "@/lib/auth-rate-limit";

describe("auth rate limit helpers", () => {
  it("hashes IP-derived buckets instead of storing raw IPs", () => {
    const hash = hashRateLimitParts("192.0.2.10", "Andrei");

    expect(hash).toMatch(/^[a-f0-9]{32}$/);
    expect(hash).not.toContain("192.0.2.10");
  });

  it("builds documented auth buckets", () => {
    expect(loginIpUserBucket("192.0.2.10", "Andrei")).toMatch(
      /^auth:login:ip_user:[a-f0-9]{32}$/,
    );
    expect(loginUserBucket("Andrei")).toBe("auth:login:user:andrei");
    expect(signupIpBucket("192.0.2.10")).toMatch(/^auth:signup:ip:[a-f0-9]{32}$/);
    expect(recoveryIpUserBucket("192.0.2.10", "Andrei")).toMatch(
      /^auth:recovery:ip_user:[a-f0-9]{32}$/,
    );
    expect(chatUserGroupBucket("user-1", "group-1")).toMatch(
      /^chat:send:user_group:[a-f0-9]{32}$/,
    );
    expect(chatUserEventBucket("user-1", "event-1")).toMatch(
      /^chat:send:user_event:[a-f0-9]{32}$/,
    );
    expect(inviteUserEventBucket("user-1", "event-1")).toMatch(
      /^invite:create:user_event:[a-f0-9]{32}$/,
    );
    expect(invitePreviewIpBucket("192.0.2.10")).toMatch(
      /^invite:preview:ip:[a-f0-9]{32}$/,
    );
  });

  it("keeps auth policies aligned with the spec", () => {
    expect(AUTH_RATE_LIMIT_POLICIES).toEqual({
      chatUserGroup: { limit: 20, windowSeconds: 60 },
      invitePreviewIp: { limit: 60, windowSeconds: 60 },
      inviteUserEvent: { limit: 6, windowSeconds: 3600 },
      loginIpUser: { limit: 5, windowSeconds: 900 },
      loginUser: { limit: 10, windowSeconds: 900 },
      signupIp: { limit: 10, windowSeconds: 3600 },
      recoveryIpUser: { limit: 3, windowSeconds: 1800 },
    });
  });

  it("limits until the active window expires", () => {
    const now = new Date("2026-05-09T12:00:00.000Z");

    expect(
      evaluateAuthRateLimit(
        { failures: 5, window_started_at: "2026-05-09T11:50:00.000Z" },
        5,
        15 * 60,
        now,
      ),
    ).toEqual({ limited: true, failures: 5, retryAfterSeconds: 300 });
  });

  it("resets status after the window expires", () => {
    const now = new Date("2026-05-09T12:00:00.000Z");

    expect(
      evaluateAuthRateLimit(
        { failures: 5, window_started_at: "2026-05-09T11:44:59.000Z" },
        5,
        15 * 60,
        now,
      ),
    ).toEqual({ limited: false, failures: 0 });
  });
});
