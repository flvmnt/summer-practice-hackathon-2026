import { describe, expect, it, vi } from "vitest";
import { getServerEnv } from "@/lib/env";

describe("server env", () => {
  it("requires long demo bearer secrets", () => {
    vi.stubEnv("DEMO_MODE_SECRET", "too-short");

    expect(() => getServerEnv()).toThrow();

    vi.unstubAllEnvs();
  });

  it("accepts absent optional demo bearer secret", () => {
    vi.stubEnv("DEMO_MODE_SECRET", "");

    expect(getServerEnv().DEMO_MODE_SECRET).toBe("");

    vi.unstubAllEnvs();
  });
});
