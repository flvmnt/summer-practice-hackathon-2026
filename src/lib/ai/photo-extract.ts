import "server-only";

import { getOrCompute } from "@/lib/ai/cache";
import { extractSportsByKeyword } from "@/lib/ai/bio-extract";
import { bioExtractionSchema, type SportSuggestion } from "@/lib/contracts/ai";
import { chatJson, getVisionModel, isGroqConfigured } from "@/lib/groq";
import { SPORT_KEYS } from "@/lib/sports";

const TTL_MS = 24 * 60 * 60 * 1000;
const PROMPT_VERSION = "photo-v1";

const SYSTEM_PROMPT = `You inspect a profile photo for a sports matching app.
Return only JSON that matches: { "suggestions": [{ "sport": string, "confidence": number, "reason": string }] }.

Supported sports: ${SPORT_KEYS.join(", ")}.

Rules:
- Only suggest supported sports.
- Prefer visible sports equipment, courts, uniforms, or activity context.
- If the photo is generic or unclear, return an empty suggestions array.
- Confidence is 0..1; omit suggestions below 0.35.
- Reason is a short visual clue, max 120 characters.`;

function fallbackPhotoSuggestions(): SportSuggestion[] {
  return extractSportsByKeyword("running tennis football").map((entry) => ({
    ...entry,
    confidence: Math.min(entry.confidence, 0.52),
    reason: "fallback photo hints",
  }));
}

export async function extractSportsFromPhoto(
  mime: string,
  bytes: Uint8Array,
): Promise<{ suggestions: SportSuggestion[]; source: "ai" | "fallback" }> {
  if (!isGroqConfigured()) {
    return { suggestions: fallbackPhotoSuggestions(), source: "fallback" };
  }

  try {
    const model = getVisionModel();
    const base64 = Buffer.from(bytes).toString("base64");
    const dataUrl = `data:${mime};base64,${base64}`;
    const result = await getOrCompute(
      ["photo-extract", PROMPT_VERSION, model, base64],
      TTL_MS,
      async () => {
        const output = await chatJson(
          model,
          [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: [
                { type: "text", text: "Extract likely sports from this image." },
                { type: "image_url", image_url: { url: dataUrl } },
              ],
            },
          ],
          bioExtractionSchema,
          { temperature: 0, maxTokens: 700 },
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
    // fall through to deterministic fallback
  }

  return { suggestions: fallbackPhotoSuggestions(), source: "fallback" };
}
