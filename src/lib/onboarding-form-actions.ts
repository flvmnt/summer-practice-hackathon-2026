"use server";

import {
  setUserSportsAction,
  updateOnboardingLocationAction,
  updateOnboardingProfileAction,
} from "@/lib/onboarding";
import { DISTANCE_OPTIONS_KM, SKILL_LEVELS, SPORT_KEYS, type SportKey } from "@/lib/sports";

export type OnboardingProfileFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  saved?: boolean;
};

export type OnboardingSportsFormState = OnboardingProfileFormState;
export type OnboardingLocationFormState = OnboardingProfileFormState;

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

function skillLevel(value: string) {
  const numeric = Number(value);
  return SKILL_LEVELS.find((level) => level === numeric) ?? 3;
}

export async function onboardingSportsFormAction(
  _previousState: OnboardingSportsFormState,
  formData: FormData,
): Promise<OnboardingSportsFormState> {
  const selectedSports = formData
    .getAll("sports")
    .filter((value): value is SportKey => typeof value === "string" && SPORT_KEYS.includes(value as SportKey));

  const result = await setUserSportsAction({
    sports: selectedSports.map((sport) => ({
      sport,
      level: skillLevel(stringField(formData, `${sport}Level`)),
    })),
  });

  if (!result.ok) {
    return {
      error: result.error,
      fieldErrors: result.fieldErrors,
    };
  }

  return { saved: true };
}

function numberField(formData: FormData, name: string) {
  return Number(stringField(formData, name));
}

function distanceField(formData: FormData) {
  const numeric = numberField(formData, "maxDistanceKm");
  return DISTANCE_OPTIONS_KM.find((distance) => distance === numeric) ?? 5;
}

export async function onboardingLocationFormAction(
  _previousState: OnboardingLocationFormState,
  formData: FormData,
): Promise<OnboardingLocationFormState> {
  const result = await updateOnboardingLocationAction({
    city: stringField(formData, "city"),
    homeLat: numberField(formData, "homeLat"),
    homeLng: numberField(formData, "homeLng"),
    maxDistanceKm: distanceField(formData),
  });

  if (!result.ok) {
    return {
      error: result.error,
      fieldErrors: result.fieldErrors,
    };
  }

  return { saved: true };
}
