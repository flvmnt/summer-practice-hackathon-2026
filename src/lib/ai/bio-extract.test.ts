import { describe, expect, it } from "vitest";
import { extractSportsByKeyword } from "@/lib/ai/bio-extract";

describe("extractSportsByKeyword", () => {
  it("matches explicit English sport mentions", () => {
    const result = extractSportsByKeyword(
      "I love football and basketball after work",
    );
    expect(result.map((s) => s.sport).sort()).toEqual([
      "basketball",
      "football",
    ]);
  });

  it("matches Romanian sport mentions with diacritics", () => {
    const result = extractSportsByKeyword(
      "Joc fotbal și fac alergare în Timișoara",
    );
    expect(result.map((s) => s.sport).sort()).toEqual(["football", "running"]);
  });

  it("matches Romanian mentions with diacritics stripped", () => {
    const result = extractSportsByKeyword(
      "Imi place baschetul si drumetiile la munte",
    );
    const sports = result.map((s) => s.sport);
    expect(sports).toContain("basketball");
    expect(sports).toContain("hiking");
  });

  it("returns empty for an unrelated bio", () => {
    const result = extractSportsByKeyword(
      "I work at Haufe and love writing TypeScript",
    );
    expect(result).toEqual([]);
  });

  it("returns empty for whitespace-only input", () => {
    expect(extractSportsByKeyword("   ")).toEqual([]);
  });

  it("caps suggestions at 5", () => {
    const result = extractSportsByKeyword(
      "I play football, basketball, tennis, volleyball, badminton, hiking, and yoga",
    );
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it("returns the SportSuggestion shape", () => {
    const [first] = extractSportsByKeyword("I run every morning");
    expect(first).toMatchObject({
      sport: "running",
      confidence: expect.any(Number),
      reason: expect.stringContaining("run"),
    });
  });

  it("does not false-match prefixes inside other words", () => {
    expect(extractSportsByKeyword("Brunch on Sundays")).toEqual([]);
  });

  it("matches ping-pong as table tennis", () => {
    const result = extractSportsByKeyword("Mostly ping-pong on weekends");
    expect(result[0]?.sport).toBe("table_tennis");
  });
});
