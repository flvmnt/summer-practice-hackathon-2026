import { z } from "zod";

export const demoConfirmSchema = z.object({
  confirm: z.literal("showup2move"),
});

export type DemoConfirmInput = z.infer<typeof demoConfirmSchema>;
