import { describe, expect, it } from "vitest";
import {
  DUMMY_PASSWORD_HASH,
  DUMMY_RECOVERY_HASH,
  hashPassword,
  hashRecoveryCode,
  verifyPassword,
  verifyRecoveryCode,
} from "@/lib/auth-crypto";

describe("auth crypto", () => {
  it("hashes and verifies passwords", async () => {
    const hash = await hashPassword("password123");

    expect(hash).not.toBe("password123");
    await expect(verifyPassword("password123", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("hashes and verifies normalized recovery codes", async () => {
    const hash = await hashRecoveryCode("sm2m-8f3k-2q9p");

    expect(hash).not.toContain("8F3K");
    await expect(verifyRecoveryCode("SM2M-8F3K-2Q9P", hash)).resolves.toBe(true);
    await expect(verifyRecoveryCode("SM2M-8F3K-2Q9R", hash)).resolves.toBe(false);
  });

  it("exports dummy hashes for timing-safe missing-user comparisons", async () => {
    await expect(verifyPassword("anything", DUMMY_PASSWORD_HASH)).resolves.toBe(false);
    await expect(verifyRecoveryCode("SM2M-DUMY-CODE", DUMMY_RECOVERY_HASH)).resolves.toBe(true);
  });
});
