import { z } from "zod";

/**
 * Zod contracts for the smart-teammate-recommendations surface.
 *
 * Every server action that fetches or acts on recommendations validates
 * against these schemas before any DB or AI work, per AGENTS.md.
 */

export const getRecommendationsForGroupInputSchema = z.object({
  groupId: z.string().uuid(),
});

export type GetRecommendationsForGroupInput = z.infer<
  typeof getRecommendationsForGroupInputSchema
>;

export const inviteRecommendedInputSchema = z.object({
  groupId: z.string().uuid(),
  userId: z.string().uuid(),
});

export type InviteRecommendedInput = z.infer<
  typeof inviteRecommendedInputSchema
>;
