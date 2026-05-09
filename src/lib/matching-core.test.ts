import { describe, expect, it } from "vitest";
import {
  formDeterministicGroups,
  haversineKm,
  type MatchCandidate,
} from "@/lib/matching-core";

function candidate(
  userId: string,
  overrides: Partial<MatchCandidate> = {},
): MatchCandidate {
  return {
    userId,
    demoRunId: null,
    sportPrefs: ["tennis"],
    city: "Timisoara",
    lat: 45.7489,
    lng: 21.2087,
    maxDistanceKm: 5,
    skillLevel: 3,
    respondedAt: new Date(`2026-05-09T10:0${userId}.000Z`),
    ...overrides,
  };
}

describe("matching core", () => {
  it("calculates nearby distances with Haversine", () => {
    expect(
      haversineKm(
        { lat: 45.7489, lng: 21.2087 },
        { lat: 45.756, lng: 21.229 },
      ),
    ).toBeLessThan(2);
  });

  it("forms groups within sport size and distance gates", () => {
    const groups = formDeterministicGroups([
      candidate("1"),
      candidate("2", { lat: 45.7495, lng: 21.209 }),
      candidate("3", { lat: 45.75, lng: 21.21 }),
      candidate("4", { lat: 45.751, lng: 21.211 }),
      candidate("5", { lat: 45.9, lng: 21.45 }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.sport).toBe("tennis");
    expect(groups[0]?.members).toHaveLength(4);
    expect(groups[0]?.members.map((member) => member.userId)).not.toContain("5");
  });

  it("assigns the earliest responder as captain exactly once", () => {
    const groups = formDeterministicGroups([
      candidate("1", { respondedAt: new Date("2026-05-09T10:02:00.000Z") }),
      candidate("2", { respondedAt: new Date("2026-05-09T10:00:00.000Z") }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.captainUserId).toBe("2");
    expect(groups[0]?.members.filter((member) => member.role === "captain")).toHaveLength(1);
  });
});
