"use server";

import { updateOnboardingProfileAction } from "@/lib/onboarding";

export type OnboardingProfileFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  saved?: boolean;
};

function stringField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function onboardingProfileFormAction(
  _previousState: OnboardingProfileFormState,
  formData: FormData,
): Promise<OnboardingProfileFormState> {
  const result = await updateOnboardingProfileAction({
    fullName: stringField(formData, "fullName"),
    bio: stringField(formData, "bio"),
  });

  if (!result.ok) {
    return {
      error: result.error,
      fieldErrors: result.fieldErrors,
    };
  }

  return { saved: true };
}
