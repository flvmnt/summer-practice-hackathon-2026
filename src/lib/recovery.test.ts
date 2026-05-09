import { describe, expect, it } from "vitest";
import { generateRecoveryCode, normalizeRecoveryCode } from "@/lib/recovery";

describe("recovery codes", () => {
  it("generates ShowUp2Move recovery codes in the documented format", () => {
    expect(generateRecoveryCode()).toMatch(/^SM2M-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  it("normalizes valid codes", () => {
    expect(normalizeRecoveryCode("sm2m-8f3k-2q9p")).toBe("SM2M-8F3K-2Q9P");
  });

  it("rejects malformed codes", () => {
    expect(() => normalizeRecoveryCode("SM2M-123")).toThrow();
  });
});
