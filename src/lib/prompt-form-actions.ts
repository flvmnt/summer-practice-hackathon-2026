"use server";

import { respondToPromptAction } from "@/lib/prompt";
import { DISTANCE_OPTIONS_KM, SPORT_KEYS, type SportKey } from "@/lib/sports";

export type TodayPromptFormState = {
  answer?: "yes" | "no";
  error?: string;
  state?: "queued" | "unavailable";
};

function stringField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function sportPrefs(formData: FormData) {
  return formData
    .getAll("sportPrefs")
    .filter((value): value is SportKey => typeof value === "string" && SPORT_KEYS.includes(value as SportKey));
}

function maxDistanceKm(formData: FormData) {
  const numeric = Number(stringField(formData, "maxDistanceKm"));
  return DISTANCE_OPTIONS_KM.find((distance) => distance === numeric);
}

export async function todayPromptFormAction(
  _previousState: TodayPromptFormState,
  formData: FormData,
): Promise<TodayPromptFormState> {
  const answer = stringField(formData, "answer") === "yes" ? "yes" : "no";
  const result = await respondToPromptAction({
    promptId: stringField(formData, "promptId"),
    answer,
    sportPrefs: sportPrefs(formData),
    maxDistanceKm: maxDistanceKm(formData),
  });

  if (!result.ok) {
    return { error: result.error };
  }

  return {
    answer,
    state: result.data.state,
  };
}
