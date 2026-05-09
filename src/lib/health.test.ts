import { afterEach, describe, expect, it, vi } from "vitest";
import { getHealthStatus } from "@/lib/health";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getHealthStatus", () => {
  it("reports process health without claiming database readiness when no DB is configured", async () => {
    vi.stubEnv("NODE_ENV", "development");
    delete process.env.DATABASE_URL;

    expect(await getHealthStatus()).toMatchObject({
      ok: true,
      process: "up",
      db: "not_configured",
      phase: "phase_1",
      version: "2026-hackathon",
    });
  });

  it("fails production health when the database is not configured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.DATABASE_URL;
    vi.stubEnv("SESSION_SECRET", "a".repeat(64));

    expect(await getHealthStatus()).toMatchObject({
      ok: false,
      db: "down",
      phase: "phase_1",
    });
  });
});
