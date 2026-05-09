import { describe, expect, it } from "vitest";
import { respondToPromptInputSchema } from "@/lib/contracts/prompt";
import { activePromptWindow } from "@/lib/prompt-window";

describe("prompt contracts", () => {
  it("maps Romania local time to prompt slots", () => {
    expect(activePromptWindow(new Date("2026-05-09T06:00:00.000Z"))).toEqual({
      windowDate: "2026-05-09",
      windowSlot: "morning",
    });
    expect(activePromptWindow(new Date("2026-05-09T11:00:00.000Z"))).toEqual({
      windowDate: "2026-05-09",
      windowSlot: "afternoon",
    });
    expect(activePromptWindow(new Date("2026-05-09T16:00:00.000Z"))).toEqual({
      windowDate: "2026-05-09",
      windowSlot: "evening",
    });
  });

  it("validates prompt responses with supported sports only", () => {
    expect(
      respondToPromptInputSchema.parse({
        promptId: "11111111-1111-4111-8111-111111111111",
        answer: "yes",
        sportPrefs: ["football", "running"],
        maxDistanceKm: 5,
      }),
    ).toEqual({
      promptId: "11111111-1111-4111-8111-111111111111",
      answer: "yes",
      sportPrefs: ["football", "running"],
      maxDistanceKm: 5,
    });

    expect(() =>
      respondToPromptInputSchema.parse({
        promptId: "11111111-1111-4111-8111-111111111111",
        answer: "maybe",
      }),
    ).toThrow();
  });
});
