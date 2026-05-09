import "server-only";
import { getOrCompute } from "@/lib/ai/cache";
import {
  SPORT_KEYWORDS,
  findMatchingKeyword,
  normalizeText,
} from "@/lib/ai/sport-keywords";
import {
  bioExtractionSchema,
  type BioExtraction,
  type SportSuggestion,
} from "@/lib/contracts/ai";
import { chatJson, getTextModel, isGroqConfigured } from "@/lib/groq";
import { SPORT_KEYS } from "@/lib/sports";

const TTL_MS = 24 * 60 * 60 * 1000;
const PROMPT_VERSION = "bio-v1";

const SYSTEM_PROMPT = `You extract sports preferences for a spontaneous sports matching app.
Return only JSON that matches: { "suggestions": [{ "sport": string, "confidence": number, "reason": string }] }.

Supported sports (only suggest from this list): ${SPORT_KEYS.join(", ")}.

Rules:
- Only suggest supported sports.
- Prefer explicit mentions over guesses.
- Confidence is 0..1; omit suggestions below 0.35.
- Reason is a short phrase quoting the bio (max 120 chars).
- Up to 5 suggestions; ranked by confidence descending.
- The bio may be in English or Romanian.`;

export function extractSportsByKeyword(bio: string): SportSuggestion[] {
  const trimmed = bio.trim();
  if (!trimmed) return [];

  const normalized = normalizeText(trimmed);
  const hits: SportSuggestion[] = [];

  for (const sport of SPORT_KEYS) {
    const matched = findMatchingKeyword(normalized, SPORT_KEYWORDS[sport]);
    if (matched) {
      hits.push({
        sport,
        confidence: 0.6,
        reason: `mentioned "${matched}"`,
      });
    }
  }

  return hits.slice(0, 5);
}

export async function extractSportsFromBio(
  bio: string,
): Promise<{ suggestions: SportSuggestion[]; source: "ai" | "fallback" }> {
  const trimmed = bio.trim();
  if (!trimmed) {
    return { suggestions: [], source: "fallback" };
  }

  if (isGroqConfigured()) {
    try {
      const model = getTextModel();
      const result = await getOrCompute<BioExtraction>(
        ["bio-extract", PROMPT_VERSION, model, trimmed],
        TTL_MS,
        async () => {
          const output = await chatJson(
            model,
            [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: trimmed },
            ],
            bioExtractionSchema,
            { temperature: 0, maxTokens: 800 },
          );
          return { output, model };
        },
      );

      const suggestions = result.suggestions
        .filter((s) => s.confidence >= 0.35)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5);

      if (suggestions.length > 0) {
        return { suggestions, source: "ai" };
      }
    } catch {
      // fall through to deterministic keyword extraction
    }
  }

  return { suggestions: extractSportsByKeyword(trimmed), source: "fallback" };
}
