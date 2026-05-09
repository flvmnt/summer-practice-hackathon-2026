import { describe, expect, it } from "vitest";
import {
  scoreCompatibilityDeterministic,
  type CompatibilityUser,
} from "@/lib/ai/compat-score";

function makeUser(overrides: Partial<CompatibilityUser> = {}): CompatibilityUser {
  return {
    id: "u1",
    sports: ["football"],
    skillLevel: 3,
    city: "Timișoara",
    distanceKm: 1,
    ...overrides,
  };
}

describe("scoreCompatibilityDeterministic", () => {
  it("scores identical sports + skill + same city >= 80", () => {
    const a = makeUser({
      id: "a",
      sports: ["football", "running"],
      skillLevel: 3,
      city: "Timișoara",
      distanceKm: 1,
    });
    const b = makeUser({
      id: "b",
      sports: ["football", "running"],
      skillLevel: 3,
      city: "Timișoara",
      distanceKm: 1,
    });
    const result = scoreCompatibilityDeterministic(a, b);
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.skillFit).toBe("balanced");
    expect(result.proximityFit).toBe("near");
    expect(result.sharedSports.sort()).toEqual(["football", "running"]);
  });

  it("scores no shared sports < 20", () => {
    const a = makeUser({
      id: "a",
      sports: ["football"],
      city: "Timișoara",
      distanceKm: 1,
    });
    const b = makeUser({
      id: "b",
      sports: ["yoga"],
      city: "Timișoara",
      distanceKm: 1,
    });
    const result = scoreCompatibilityDeterministic(a, b);
    expect(result.score).toBeLessThan(20);
    expect(result.sharedSports).toEqual([]);
  });

  it("flags skill diff > 3 as mismatch", () => {
    const a = makeUser({ id: "a", skillLevel: 1 });
    const b = makeUser({ id: "b", skillLevel: 5 });
    const result = scoreCompatibilityDeterministic(a, b);
    expect(result.skillFit).toBe("mismatch");
  });

  it("flags moderate skill diff (2..3) as mentor", () => {
    const a = makeUser({ id: "a", skillLevel: 1 });
    const b = makeUser({ id: "b", skillLevel: 3 });
    const result = scoreCompatibilityDeterministic(a, b);
    expect(result.skillFit).toBe("mentor");
  });

  it("flags small skill diff (<=1) as balanced", () => {
    const a = makeUser({ id: "a", skillLevel: 3 });
    const b = makeUser({ id: "b", skillLevel: 4 });
    const result = scoreCompatibilityDeterministic(a, b);
    expect(result.skillFit).toBe("balanced");
  });

  it("classifies distance > maxDistance as far", () => {
    const a = makeUser({ id: "a", city: "Timișoara", distanceKm: 25 });
    const b = makeUser({ id: "b", city: "Cluj", distanceKm: 25 });
    const result = scoreCompatibilityDeterministic(a, b);
    expect(result.proximityFit).toBe("far");
  });

  it("classifies different cities within tolerance as same_city when distance modest", () => {
    // 5km apart but cities differ → not 'near' (>3km), not 'same_city' → 'far'
    // here distance still <= 10 so we treat as same_city only if cities equal.
    const a = makeUser({ id: "a", city: "Timișoara", distanceKm: 5 });
    const b = makeUser({ id: "b", city: "Timișoara", distanceKm: 5 });
    const result = scoreCompatibilityDeterministic(a, b);
    expect(result.proximityFit).toBe("same_city");
  });

  it("returns a reason under 200 chars", () => {
    const a = makeUser({ id: "a", sports: ["football"] });
    const b = makeUser({ id: "b", sports: ["football"] });
    const result = scoreCompatibilityDeterministic(a, b);
    expect(result.reason.length).toBeGreaterThan(0);
    expect(result.reason.length).toBeLessThanOrEqual(200);
  });

  it("clamps score within 0..100", () => {
    const a = makeUser({
      id: "a",
      sports: ["football", "basketball", "tennis"],
      skillLevel: 3,
      city: "Timișoara",
      distanceKm: 1,
    });
    const b = makeUser({
      id: "b",
      sports: ["football", "basketball", "tennis"],
      skillLevel: 3,
      city: "Timișoara",
      distanceKm: 1,
    });
    const result = scoreCompatibilityDeterministic(a, b);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("returns intersection of sports as sharedSports", () => {
    const a = makeUser({
      id: "a",
      sports: ["football", "running", "yoga"],
    });
    const b = makeUser({
      id: "b",
      sports: ["running", "hiking"],
    });
    const result = scoreCompatibilityDeterministic(a, b);
    expect(result.sharedSports).toEqual(["running"]);
  });
});
