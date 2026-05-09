import { z } from "zod";

export const postGroupMessageInputSchema = z.object({
  groupId: z.string().uuid(),
  body: z.string().trim().min(1, "message_required").max(1000, "message_too_long"),
  clientId: z.string().trim().min(1).max(80),
});

export const loadGroupMessagesInputSchema = z.object({
  groupId: z.string().uuid(),
  limit: z.number().int().min(1).max(50).default(30),
});

export type PostGroupMessageInput = z.infer<typeof postGroupMessageInputSchema>;
export type LoadGroupMessagesInput = z.infer<typeof loadGroupMessagesInputSchema>;
