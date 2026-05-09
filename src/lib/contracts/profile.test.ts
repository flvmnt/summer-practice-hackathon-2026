import { describe, expect, it } from "vitest";
import {
  onboardingLocationInputSchema,
  setUserSportsInputSchema,
} from "@/lib/contracts/profile";

describe("profile contracts", () => {
  it("accepts supported sports with skill levels", () => {
    expect(
      setUserSportsInputSchema.parse({
        sports: [
          { sport: "football", level: 3 },
          { sport: "running", level: 2 },
        ],
      }),
    ).toEqual({
      sports: [
        { sport: "football", level: 3 },
        { sport: "running", level: 2 },
      ],
    });
  });

  it("requires at least one supported sport", () => {
    expect(() => setUserSportsInputSchema.parse({ sports: [] })).toThrow();
    expect(() =>
      setUserSportsInputSchema.parse({ sports: [{ sport: "boxing", level: 2 }] }),
    ).toThrow();
  });

  it("accepts privacy-safe location fields and fixed distance options", () => {
    expect(
      onboardingLocationInputSchema.parse({
        city: "Timisoara",
        homeLat: 45.7489,
        homeLng: 21.2087,
        maxDistanceKm: 5,
      }),
    ).toEqual({
      city: "Timisoara",
      homeLat: 45.7489,
      homeLng: 21.2087,
      maxDistanceKm: 5,
    });

    expect(() =>
      onboardingLocationInputSchema.parse({
        city: "T",
        homeLat: 95,
        homeLng: 21.2087,
        maxDistanceKm: 7,
      }),
    ).toThrow();
  });
});
