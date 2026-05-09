import { z } from "zod";

export const castVenueVoteInputSchema = z.object({
  eventId: z.string().uuid(),
  optionIdx: z.coerce.number().int().min(0).max(9),
});

export type CastVenueVoteInput = z.infer<typeof castVenueVoteInputSchema>;
