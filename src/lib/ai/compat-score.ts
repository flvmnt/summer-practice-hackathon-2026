import "server-only";
import { z } from "zod";
import { getOrCompute } from "@/lib/ai/cache";
import { chatJson, getTextModel, isGroqConfigured } from "@/lib/groq";
import { SPORT_KEYS, type SportKey } from "@/lib/sports";

const TTL_MS = 24 * 60 * 60 * 1000;
const PROMPT_VERSION = "compat-v1";

const sportEnum = z.enum(SPORT_KEYS);

export const compatibilityScoreSchema = z.object({
  score: z.number().min(0).max(100),
  sharedSports: z.array(sportEnum).max(SPORT_KEYS.length),
  skillFit: z.enum(["balanced", "mentor", "mismatch"]),
  scheduleFit: z.enum(["high", "medium", "low"]),
  proximityFit: z.enum(["near", "same_city", "far"]),
  reason: z.string().min(1).max(200),
});

export type CompatibilityScore = z.infer<typeof compatibilityScoreSchema>;

export type CompatibilityUser = {
  id: string;
  sports: SportKey[];
  skillLevel: number;
  city: string;
  distanceKm: number;
};

export type CompatibilityResult = CompatibilityScore & {
  source: "ai" | "fallback";
};

const SYSTEM_PROMPT = `You score sports compatibility between two users for a spontaneous sports matching app.
Return only JSON matching: { "score": number 0-100, "sharedSports": string[], "skillFit": "balanced"|"mentor"|"mismatch", "scheduleFit": "high"|"medium"|"low", "proximityFit": "near"|"same_city"|"far", "reason": string }.

Supported sports (only emit values from this list in sharedSports): ${SPORT_KEYS.join(", ")}.

Rules:
- score is an integer 0..100 reflecting how well two users match.
- sharedSports must be the intersection of the two users' sports lists.
- skillFit: 'balanced' if skill diff <= 1, 'mentor' if 2 <= diff <= 3, 'mismatch' if diff > 3.
- proximityFit: 'near' if distance <= 3km, 'same_city' if same city, 'far' otherwise.
- scheduleFit: assume 'medium' when no schedule info.
- reason must be <= 200 characters, plain English, no PII, no quotes from user input.
- If no shared sports the score must be < 20.
- Never identify, profile, or infer sensitive attributes about users.`;

const NEAR_KM = 3;

function intersectSports(a: SportKey[], b: SportKey[]): SportKey[] {
  const setB = new Set(b);
  const seen = new Set<SportKey>();
  const out: SportKey[] = [];
  for (const sport of a) {
    if (setB.has(sport) && !seen.has(sport)) {
      seen.add(sport);
      out.push(sport);
    }
  }
  return out;
}

function classifySkillFit(
  diff: number,
): "balanced" | "mentor" | "mismatch" {
  if (diff <= 1) return "balanced";
  if (diff <= 3) return "mentor";
  return "mismatch";
}

function classifyProximity(
  distanceKm: number,
  sameCity: boolean,
  maxDistanceKm: number,
): "near" | "same_city" | "far" {
  if (distanceKm > maxDistanceKm) return "far";
  if (distanceKm <= NEAR_KM) return "near";
  if (sameCity) return "same_city";
  return "far";
}

function buildReason(
  shared: SportKey[],
  skillFit: "balanced" | "mentor" | "mismatch",
  proximityFit: "near" | "same_city" | "far",
  distanceKm: number,
): string {
  if (shared.length === 0) {
    return "No shared sports yet — try adding more interests.";
  }
  const sportText =
    shared.length === 1
      ? `share ${shared[0].replace("_", " ")}`
      : `share ${shared.slice(0, 2).join(" and ").replace(/_/g, " ")}`;
  const skillText =
    skillFit === "balanced"
      ? "similar skill"
      : skillFit === "mentor"
        ? "mentor-friendly skill gap"
        : "skill mismatch";
  const distanceText =
    proximityFit === "near"
      ? `${distanceKm.toFixed(1)}km apart`
      : proximityFit === "same_city"
        ? "same city"
        : "far apart";
  const reason = `Both ${sportText}, ${skillText}, ${distanceText}.`;
  return reason.length > 200 ? reason.slice(0, 197) + "..." : reason;
}

export function scoreCompatibilityDeterministic(
  userA: CompatibilityUser,
  userB: CompatibilityUser,
): CompatibilityScore {
  const shared = intersectSports(userA.sports, userB.sports);
  const skillDiff = Math.abs(userA.skillLevel - userB.skillLevel);
  const skillFit = classifySkillFit(skillDiff);

  const distanceKm = Math.max(userA.distanceKm, userB.distanceKm);
  const sameCity =
    userA.city.trim().toLowerCase() === userB.city.trim().toLowerCase() &&
    userA.city.trim().length > 0;
  // Use the minimum of any explicit per-user max — we don't have it here so
  // fall back to a generous default of 10km when both users tolerate it.
  const maxDistanceKm = 10;
  const proximityFit = classifyProximity(distanceKm, sameCity, maxDistanceKm);

  // Weights aligned with spec (sport 30, distance 20, availability 20,
  // group-size 10, skill 10, AI/bio 10). For pair compat we collapse
  // group-size + AI/bio into a baseline 'schedule fit' assumption.
  let score = 0;

  // Sport match (30): scale by intersection vs union ratio for richer signal.
  if (shared.length > 0) {
    const union = new Set<SportKey>([...userA.sports, ...userB.sports]);
    const ratio = shared.length / Math.max(1, union.size);
    score += Math.round(30 * (0.5 + 0.5 * ratio));
  }

  // Distance (20)
  if (proximityFit === "near") score += 20;
  else if (proximityFit === "same_city") score += 12;
  else score += 0;

  // Availability fit (20) — no signal here, assume medium.
  const scheduleFit: "high" | "medium" | "low" = "medium";
  score += 12;

  // Group-size contribution (10) — neutral default.
  score += 6;

  // Skill balance (10)
  if (skillFit === "balanced") score += 10;
  else if (skillFit === "mentor") score += 5;
  else score += 0;

  // AI/bio compatibility (10) — neutral default for fallback.
  score += 5;

  // If no shared sports at all, force a low score per spec rule.
  if (shared.length === 0) {
    score = Math.min(score, 18);
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const reason = buildReason(shared, skillFit, proximityFit, distanceKm);

  return {
    score,
    sharedSports: shared,
    skillFit,
    scheduleFit,
    proximityFit,
    reason,
  };
}

function userFingerprint(user: CompatibilityUser): string {
  const sports = [...user.sports].sort().join(",");
  return [
    user.id,
    sports,
    String(user.skillLevel),
    user.city.trim().toLowerCase(),
    user.distanceKm.toFixed(1),
  ].join("|");
}

export async function scoreCompatibility(
  userA: CompatibilityUser,
  userB: CompatibilityUser,
): Promise<CompatibilityResult> {
  const deterministic = scoreCompatibilityDeterministic(userA, userB);

  if (!isGroqConfigured()) {
    return { ...deterministic, source: "fallback" };
  }

  // Sort cache key by id so (a,b) and (b,a) hit the same row.
  const [first, second] =
    userA.id <= userB.id ? [userA, userB] : [userB, userA];

  try {
    const model = getTextModel();
    const result = await getOrCompute<CompatibilityScore>(
      [
        "compat-score",
        PROMPT_VERSION,
        model,
        userFingerprint(first),
        userFingerprint(second),
      ],
      TTL_MS,
      async () => {
        const userPayload = JSON.stringify({
          userA: {
            id: first.id,
            sports: first.sports,
            skillLevel: first.skillLevel,
            city: first.city,
            distanceKm: first.distanceKm,
          },
          userB: {
            id: second.id,
            sports: second.sports,
            skillLevel: second.skillLevel,
            city: second.city,
            distanceKm: second.distanceKm,
          },
          deterministic,
        });
        const output = await chatJson(
          model,
          [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPayload },
          ],
          compatibilityScoreSchema,
          { temperature: 0, maxTokens: 400 },
        );
        return { output, model };
      },
    );

    // Defensive: trust deterministic sharedSports/proximity classifications
    // over AI output, but keep AI's score and reason.
    return {
      score: result.score,
      sharedSports: deterministic.sharedSports,
      skillFit: deterministic.skillFit,
      scheduleFit: result.scheduleFit,
      proximityFit: deterministic.proximityFit,
      reason: result.reason,
      source: "ai",
    };
  } catch {
    return { ...deterministic, source: "fallback" };
  }
}
