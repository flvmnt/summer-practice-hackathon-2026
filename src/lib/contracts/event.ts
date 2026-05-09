import { z } from "zod";

export const createGroupEventInputSchema = z.object({
  groupId: z.string().uuid(),
});

export const loadEventInputSchema = z.object({
  eventId: z.string().uuid(),
});

export type CreateGroupEventInput = z.infer<typeof createGroupEventInputSchema>;
export type LoadEventInput = z.infer<typeof loadEventInputSchema>;
