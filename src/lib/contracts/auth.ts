import { z } from "zod";
import { routing } from "@/i18n/routing";

export const usernameSchema = z
  .string()
  .trim()
  .regex(/^[a-zA-Z0-9_-]{3,30}$/, "invalid_username")
  .transform((value) => value.toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, "password_too_short")
  .max(128, "password_too_long")
  .refine((value) => value.trim().length > 0, "password_required");

export const recoveryCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^SM2M-[A-Z0-9]{4}-[A-Z0-9]{4}$/, "invalid_recovery_code");

export const fullNameSchema = z
  .string()
  .trim()
  .min(1, "full_name_required")
  .max(80, "full_name_too_long")
  .regex(/^[\p{L}\p{M}' -]+$/u, "invalid_full_name");

export const localeSchema = z.enum(routing.locales);

export const signupInputSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  locale: localeSchema.default(routing.defaultLocale),
});

export const loginInputSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, "password_required").max(200),
});

export const recoverAccountInputSchema = z.object({
  username: usernameSchema,
  recoveryCode: recoveryCodeSchema,
  newPassword: passwordSchema,
});

export const onboardingProfileInputSchema = z.object({
  fullName: fullNameSchema,
  bio: z.string().trim().min(1, "bio_required").max(800),
});

export type SignupInput = z.infer<typeof signupInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
export type RecoverAccountInput = z.infer<typeof recoverAccountInputSchema>;
export type OnboardingProfileInput = z.infer<typeof onboardingProfileInputSchema>;
