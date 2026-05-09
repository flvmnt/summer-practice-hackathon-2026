import { z } from "zod";

export const createGroupEventInputSchema = z.object({
  groupId: z.string().uuid(),
});

export const loadEventInputSchema = z.object({
  eventId: z.string().uuid(),
});

export const updateEventRsvpInputSchema = z.object({
  eventId: z.string().uuid(),
  status: z.enum(["going", "maybe", "declined"]),
});

export type CreateGroupEventInput = z.infer<typeof createGroupEventInputSchema>;
export type LoadEventInput = z.infer<typeof loadEventInputSchema>;
export type UpdateEventRsvpInput = z.infer<typeof updateEventRsvpInputSchema>;
