import { z } from "zod";
import { routing } from "@/i18n/routing";

export const eventInviteTokenSchema = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_[A-Za-z0-9_-]{32,96}$/);

export const eventInviteInputSchema = z.object({
  eventId: z.string().uuid(),
  locale: z.enum(routing.locales).default(routing.defaultLocale),
});

export type EventInviteInput = z.infer<typeof eventInviteInputSchema>;
