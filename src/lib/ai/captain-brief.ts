import "server-only";
import { z } from "zod";
import { getOrCompute } from "@/lib/ai/cache";
import { chatJson, getTextModel, isGroqConfigured } from "@/lib/groq";
import { SPORT_KEYS, type SportKey } from "@/lib/sports";

const TTL_MS = 24 * 60 * 60 * 1000;
const PROMPT_VERSION = "captain-brief-v1";

export const WEATHER_KINDS = ["sunny", "rainy", "cloudy"] as const;
export type WeatherKind = (typeof WEATHER_KINDS)[number];

export const captainBriefDecisionSchema = z.object({
  id: z.enum(["venue", "time", "team"]),
  question: z.string().min(1).max(140),
});

export const captainBriefSchema = z.object({
  summary: z.string().min(1).max(280),
  decisions: z.array(captainBriefDecisionSchema).max(3),
  reason: z.string().min(1).max(200),
});

export type CaptainBriefDecision = z.infer<typeof captainBriefDecisionSchema>;
export type CaptainBrief = z.infer<typeof captainBriefSchema>;

export type CaptainBriefInput = {
  groupSize: number;
  sport: SportKey;
  weather: WeatherKind;
  candidateVenues: { name: string; distanceKm: number }[];
};

const SYSTEM_PROMPT = `You are the captain assistant for a spontaneous sports matching app.
Return only JSON that matches: { "summary": string, "decisions": [{ "id": "venue"|"time"|"team", "question": string }], "reason": string }.

Tone:
- captain-friendly, concise, direct.
- summary <= 280 characters; reason <= 200 characters.
- decisions has at most 3 entries; question is short and actionable.

Supported sports: ${SPORT_KEYS.join(", ")}.
Weather is one of: ${WEATHER_KINDS.join(", ")}.

Rules:
- Use the closest venue first when proposing where to play.
- Prefer outdoor venues when weather is sunny; warn if rainy.
- Never invent venues; only reference names from the provided list.
- Do not include sensitive info, secrets, or links.`;

function describeWeather(weather: WeatherKind): string {
  switch (weather) {
    case "sunny":
      return "Weather looks good";
    case "cloudy":
      return "Weather is cloudy but playable";
    case "rainy":
      return "Weather is rainy - consider indoor backup";
  }
}

function pickClosestVenue(
  venues: CaptainBriefInput["candidateVenues"],
): { name: string; distanceKm: number } | null {
  if (venues.length === 0) return null;
  return [...venues].sort((a, b) => a.distanceKm - b.distanceKm)[0] ?? null;
}

function clampSummary(text: string): string {
  if (text.length <= 280) return text;
  return text.slice(0, 277).trimEnd() + "...";
}

function clampReason(text: string): string {
  if (text.length <= 200) return text;
  return text.slice(0, 197).trimEnd() + "...";
}

export function buildFallbackCaptainBrief(
  input: CaptainBriefInput,
): CaptainBrief {
  const { groupSize, sport, weather, candidateVenues } = input;
  const closest = pickClosestVenue(candidateVenues);
  const weatherLine = describeWeather(weather);

  const venuePart = closest
    ? `Venue: ${closest.name} (${closest.distanceKm.toFixed(1)}km).`
    : "No nearby venue locked in yet.";

  const summary = clampSummary(
    `${capitalize(sport.replace("_", " "))} for ${groupSize}. ${venuePart} ${weatherLine}.`,
  );

  const reason = clampReason(
    closest
      ? `Closest ${sport.replace("_", " ")} venue is ${closest.name}, ${closest.distanceKm.toFixed(1)}km away. ${weatherLine}.`
      : `Group of ${groupSize} for ${sport.replace("_", " ")}. ${weatherLine}.`,
  );

  return {
    summary,
    decisions: [],
    reason,
  };
}

function capitalize(text: string): string {
  if (!text) return text;
  return text[0].toUpperCase() + text.slice(1);
}

function normalizeAiBrief(brief: CaptainBrief): CaptainBrief {
  return {
    summary: clampSummary(brief.summary.trim()),
    decisions: brief.decisions.slice(0, 3).map((d) => ({
      id: d.id,
      question: d.question.trim(),
    })),
    reason: clampReason(brief.reason.trim()),
  };
}

export async function generateCaptainBrief(
  input: CaptainBriefInput,
): Promise<{ brief: CaptainBrief; source: "ai" | "fallback" }> {
  if (isGroqConfigured()) {
    try {
      const model = getTextModel();
      const cacheKey = [
        "captain-brief",
        PROMPT_VERSION,
        model,
        JSON.stringify(input),
      ];

      const result = await getOrCompute<CaptainBrief>(
        cacheKey,
        TTL_MS,
        async () => {
          const userPayload = JSON.stringify({
            groupSize: input.groupSize,
            sport: input.sport,
            weather: input.weather,
            candidateVenues: input.candidateVenues.map((v) => ({
              name: v.name,
              distanceKm: Number(v.distanceKm.toFixed(2)),
            })),
          });

          const output = await chatJson(
            model,
            [
              { role: "system", content: SYSTEM_PROMPT },
              {
                role: "user",
                content: `Plan input (JSON):\n${userPayload}\n\nReturn the JSON brief.`,
              },
            ],
            captainBriefSchema,
            { temperature: 0, maxTokens: 600 },
          );

          return { output: normalizeAiBrief(output), model };
        },
      );

      return { brief: result, source: "ai" };
    } catch {
      // fall through to deterministic brief
    }
  }

  return { brief: buildFallbackCaptainBrief(input), source: "fallback" };
}
