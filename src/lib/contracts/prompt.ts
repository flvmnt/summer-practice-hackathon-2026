import { z } from "zod";
import { DISTANCE_OPTIONS_KM, SPORT_KEYS } from "@/lib/sports";

export const promptSlotSchema = z.enum(["morning", "afternoon", "evening"]);
export const promptAnswerSchema = z.enum(["yes", "no"]);

export const respondToPromptInputSchema = z.object({
  promptId: z.string().uuid(),
  answer: promptAnswerSchema,
  sportPrefs: z.array(z.enum(SPORT_KEYS)).max(10).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  maxDistanceKm: z
    .union([
      z.literal(DISTANCE_OPTIONS_KM[0]),
      z.literal(DISTANCE_OPTIONS_KM[1]),
      z.literal(DISTANCE_OPTIONS_KM[2]),
      z.literal(DISTANCE_OPTIONS_KM[3]),
    ])
    .optional(),
});

export type PromptSlot = z.infer<typeof promptSlotSchema>;
export type PromptAnswer = z.infer<typeof promptAnswerSchema>;
export type RespondToPromptInput = z.infer<typeof respondToPromptInputSchema>;
