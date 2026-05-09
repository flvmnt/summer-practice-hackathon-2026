import { describe, expect, it } from "vitest";
import { getHealthStatus } from "@/lib/health";

describe("getHealthStatus", () => {
  it("reports the phase 0 process health without claiming database readiness", () => {
    expect(getHealthStatus()).toMatchObject({
      ok: true,
      process: "up",
      db: "not_configured",
      phase: "phase_0",
      version: "2026-hackathon",
    });
  });
});
