import { describe, expect, it } from "vitest";
import {
  fullNameSchema,
  loginInputSchema,
  onboardingProfileInputSchema,
  recoveryCodeSchema,
  signupInputSchema,
  usernameSchema,
} from "@/lib/contracts/auth";

describe("auth contracts", () => {
  it("accepts the documented username shape", () => {
    expect(usernameSchema.parse("andrei_27")).toBe("andrei_27");
  });

  it("rejects invalid usernames", () => {
    expect(() => usernameSchema.parse("ab")).toThrow();
    expect(() => usernameSchema.parse("andrei.ro")).toThrow();
  });

  it("keeps signup minimal and defaults locale to Romanian", () => {
    expect(signupInputSchema.parse({ username: "ana", password: "password123" })).toEqual({
      username: "ana",
      password: "password123",
      locale: "ro",
    });
  });

  it("normalizes recovery codes before validation", () => {
    expect(recoveryCodeSchema.parse("sm2m-8f3k-2q9p")).toBe("SM2M-8F3K-2Q9P");
  });

  it("allows Romanian names without accepting empty profile names", () => {
    expect(fullNameSchema.parse("Ana-Maria Popescu")).toBe("Ana-Maria Popescu");
    expect(fullNameSchema.parse("Ștefan O'Neil")).toBe("Ștefan O'Neil");
    expect(() => fullNameSchema.parse("")).toThrow();
    expect(() => fullNameSchema.parse("---")).toThrow();
  });

  it("does not validate login with a blank password", () => {
    expect(() => loginInputSchema.parse({ username: "ana", password: "" })).toThrow();
  });

  it("requires profile onboarding identity and bio", () => {
    expect(
      onboardingProfileInputSchema.parse({
        fullName: "Ana Popescu",
        bio: "Tennis after work, beginner-friendly groups preferred.",
      }),
    ).toEqual({
      fullName: "Ana Popescu",
      bio: "Tennis after work, beginner-friendly groups preferred.",
    });

    expect(() =>
      onboardingProfileInputSchema.parse({ fullName: "Ana Popescu", bio: "" }),
    ).toThrow();
  });
});
