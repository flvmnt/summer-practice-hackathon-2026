import "server-only";
import { z } from "zod";

const booleanFlag = z
  .string()
  .optional()
  .transform((value) => value === "true");

const serverEnvSchema = z
  .object({
    ALLOW_DEMO_MODE: booleanFlag,
    ALLOW_DEMO_SEED: booleanFlag,
    DEMO_MODE_SECRET: z.string().min(64).optional().or(z.literal("")),
    DEMO_SEED_CONFIRM: z.string().optional(),
    DATABASE_URL: z.string().url().optional(),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PUBLIC_BASE_URL: z.string().url().optional(),
    SESSION_SECRET: z.string().min(64).optional(),
    VERCEL_GIT_COMMIT_SHA: z.string().optional(),
    RAILWAY_GIT_COMMIT_SHA: z.string().optional(),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== "production") {
      return;
    }
    if (!env.DATABASE_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["DATABASE_URL"],
        message: "DATABASE_URL is required in production",
      });
    }
    if (!env.SESSION_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["SESSION_SECRET"],
        message: "SESSION_SECRET is required in production",
      });
    }
    if (!env.PUBLIC_BASE_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["PUBLIC_BASE_URL"],
        message: "PUBLIC_BASE_URL is required in production",
      });
    }
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getServerEnv(): ServerEnv {
  return serverEnvSchema.parse(process.env);
}
