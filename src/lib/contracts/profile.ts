import { z } from "zod";
import { DISTANCE_OPTIONS_KM, SKILL_LEVELS, SPORT_KEYS } from "@/lib/sports";

export const sportKeySchema = z.enum(SPORT_KEYS);
export const skillLevelSchema = z.union([
  z.literal(SKILL_LEVELS[0]),
  z.literal(SKILL_LEVELS[1]),
  z.literal(SKILL_LEVELS[2]),
  z.literal(SKILL_LEVELS[3]),
  z.literal(SKILL_LEVELS[4]),
]);

export const userSportInputSchema = z.object({
  sport: sportKeySchema,
  level: skillLevelSchema,
});

export const setUserSportsInputSchema = z.object({
  sports: z.array(userSportInputSchema).min(1, "sports_required").max(10),
});

export const onboardingLocationInputSchema = z.object({
  city: z.string().trim().min(2, "city_required").max(100),
  homeLat: z.number().min(-90, "invalid_latitude").max(90, "invalid_latitude"),
  homeLng: z.number().min(-180, "invalid_longitude").max(180, "invalid_longitude"),
  maxDistanceKm: z.union([
    z.literal(DISTANCE_OPTIONS_KM[0]),
    z.literal(DISTANCE_OPTIONS_KM[1]),
    z.literal(DISTANCE_OPTIONS_KM[2]),
    z.literal(DISTANCE_OPTIONS_KM[3]),
  ]),
});

export type SetUserSportsInput = z.infer<typeof setUserSportsInputSchema>;
export type OnboardingLocationInput = z.infer<typeof onboardingLocationInputSchema>;
