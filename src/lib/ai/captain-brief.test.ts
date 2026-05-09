import { describe, expect, it } from "vitest";
import {
  buildFallbackCaptainBrief,
  captainBriefSchema,
} from "@/lib/ai/captain-brief";

describe("buildFallbackCaptainBrief", () => {
  it("produces a captain brief for 12-player football on a sunny day with the closest venue", () => {
    const brief = buildFallbackCaptainBrief({
      groupSize: 12,
      sport: "football",
      weather: "sunny",
      candidateVenues: [
        { name: "Iulius Park Pitch", distanceKm: 2.4 },
        { name: "Stadium Dan Paltinisanu", distanceKm: 5.1 },
        { name: "Local Field", distanceKm: 0.8 },
      ],
    });

    expect(captainBriefSchema.parse(brief)).toBeTruthy();
    expect(brief.summary.toLowerCase()).toContain("football");
    expect(brief.summary).toContain("12");
    // closest venue should be referenced
    expect(brief.summary).toContain("Local Field");
    expect(brief.decisions).toEqual([]);
    expect(brief.summary.length).toBeLessThanOrEqual(280);
    expect(brief.reason.length).toBeLessThanOrEqual(200);
  });

  it("still produces a brief when no candidate venues are provided", () => {
    const brief = buildFallbackCaptainBrief({
      groupSize: 4,
      sport: "tennis",
      weather: "cloudy",
      candidateVenues: [],
    });

    expect(captainBriefSchema.parse(brief)).toBeTruthy();
    expect(brief.summary.toLowerCase()).toContain("tennis");
    expect(brief.summary).toContain("4");
    // weather context should be reflected somehow
    expect(brief.reason.toLowerCase()).toContain("cloudy");
    expect(brief.decisions).toEqual([]);
  });

  it("flags rainy weather in the reason text", () => {
    const brief = buildFallbackCaptainBrief({
      groupSize: 6,
      sport: "basketball",
      weather: "rainy",
      candidateVenues: [{ name: "Indoor Court A", distanceKm: 1.2 }],
    });

    expect(brief.reason.toLowerCase()).toContain("rainy");
    expect(brief.summary).toContain("Indoor Court A");
  });

  it("conforms to the captain brief schema bounds", () => {
    const brief = buildFallbackCaptainBrief({
      groupSize: 8,
      sport: "table_tennis",
      weather: "sunny",
      candidateVenues: [{ name: "Club TT", distanceKm: 3 }],
    });

    const parsed = captainBriefSchema.safeParse(brief);
    expect(parsed.success).toBe(true);
  });
});
