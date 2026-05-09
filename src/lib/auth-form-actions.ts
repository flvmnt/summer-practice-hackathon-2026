"use server";

import { redirect } from "next/navigation";
import type { AppLocale } from "@/i18n/routing";
import { loginAction, recoverAccountAction, signupAction } from "@/lib/auth";
import { getOnboardingUserState } from "@/lib/onboarding-state";

export type AuthFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  recoveryCode?: string;
  newRecoveryCode?: string;
};

function stringField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function localeField(formData: FormData): AppLocale {
  return stringField(formData, "locale") === "en" ? "en" : "ro";
}

async function nextPostLoginPath(locale: AppLocale) {
  const user = await getOnboardingUserState();
  if (!user?.bio) {
    return `/${locale}/onboarding/profile`;
  }

  if (user.sports.length === 0) {
    return `/${locale}/onboarding/sports`;
  }

  if (!user.city || !user.homeLat || !user.homeLng) {
    return `/${locale}/onboarding/location`;
  }

  return `/${locale}/today`;
}

export async function signupFormAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const result = await signupAction({
    username: stringField(formData, "username"),
    password: stringField(formData, "password"),
    locale: localeField(formData),
  });

  if (!result.ok) {
    return {
      error: result.error,
      fieldErrors: result.fieldErrors,
    };
  }

  return {
    recoveryCode: result.data.recoveryCode,
  };
}

export async function loginFormAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const locale = localeField(formData);
  const result = await loginAction({
    username: stringField(formData, "username"),
    password: stringField(formData, "password"),
  });

  if (!result.ok) {
    return {
      error: result.error,
      fieldErrors: result.fieldErrors,
    };
  }

  redirect(await nextPostLoginPath(locale));
}

export async function recoverFormAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const result = await recoverAccountAction({
    username: stringField(formData, "username"),
    recoveryCode: stringField(formData, "recoveryCode"),
    newPassword: stringField(formData, "newPassword"),
  });

  if (!result.ok) {
    return {
      error: result.error,
      fieldErrors: result.fieldErrors,
    };
  }

  return {
    newRecoveryCode: result.data.newRecoveryCode,
  };
}
