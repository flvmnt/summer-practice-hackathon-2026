import { z } from "zod";
import { SPORT_KEYS } from "@/lib/sports";

const sportEnum = z.enum(SPORT_KEYS);

export const sportSuggestionSchema = z.object({
  sport: sportEnum,
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1).max(160),
});

export const bioExtractionSchema = z.object({
  suggestions: z.array(sportSuggestionSchema).max(8),
});

export type SportSuggestion = z.infer<typeof sportSuggestionSchema>;
export type BioExtraction = z.infer<typeof bioExtractionSchema>;
