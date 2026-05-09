import { afterEach, describe, expect, it, vi } from "vitest";
import { getSessionOptions } from "@/lib/session";

const originalSecret = process.env.SESSION_SECRET;

afterEach(() => {
  vi.unstubAllEnvs();
  if (originalSecret === undefined) {
    delete process.env.SESSION_SECRET;
  } else {
    process.env.SESSION_SECRET = originalSecret;
  }
});

describe("session options", () => {
  it("uses secure cookies only in production", () => {
    vi.stubEnv("NODE_ENV", "development");
    delete process.env.SESSION_SECRET;

    expect(getSessionOptions().cookieOptions?.secure).toBe(false);
  });

  it("requires SESSION_SECRET in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.SESSION_SECRET;

    expect(() => getSessionOptions()).toThrow("SESSION_SECRET is required in production");
  });
});
