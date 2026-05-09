"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import type { AppLocale } from "@/i18n/routing";
import {
  onboardingSportsFormAction,
  type OnboardingSportsFormState,
} from "@/lib/onboarding-form-actions";
import { SPORT_KEYS, type SportKey } from "@/lib/sports";

type SportsFormCopy = {
  submit: string;
  pending: string;
  genericError: string;
  unauthorized: string;
  sportsRequired: string;
  successTitle: string;
  successBody: string;
  continue: string;
  levels: Record<string, string>;
  sports: Record<SportKey, string>;
};

const initialState: OnboardingSportsFormState = {};

function errorText(code: string | undefined, copy: SportsFormCopy) {
  if (code === "sports_required" || code === "validation") {
    return copy.sportsRequired;
  }

  if (code === "unauthorized") {
    return copy.unauthorized;
  }

  if (code) {
    return copy.genericError;
  }

  return undefined;
}

export function SportsForm({
  copy,
  defaultSports,
  locale,
}: {
  copy: SportsFormCopy;
  defaultSports: Array<{ sport: SportKey; level: number }>;
  locale: AppLocale;
}) {
  const [state, formAction] = useActionState(onboardingSportsFormAction, initialState);
  const formError = errorText(state.fieldErrors?.sports ?? state.error, copy);
  const selected = new Set(defaultSports.map((entry) => entry.sport));
  const levels = new Map(defaultSports.map((entry) => [entry.sport, entry.level]));

  if (state.saved) {
    return (
      <div className="rounded-md border border-[var(--line)] bg-[var(--mint)] p-4">
        <h2 className="text-lg font-bold">{copy.successTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          {copy.successBody}
        </p>
        <Link
          className="mt-4 inline-flex min-h-12 items-center justify-center rounded-md bg-[var(--lime)] px-5 text-sm font-semibold text-[var(--navy)]"
          href={`/${locale}/onboarding/location`}
        >
          {copy.continue}
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {SPORT_KEYS.map((sport) => (
          <label
            className="grid gap-3 rounded-md border border-[var(--line)] bg-white p-3"
            key={sport}
          >
            <span className="flex items-center gap-2 text-sm font-bold">
              <input
                className="size-5 accent-[var(--navy)]"
                defaultChecked={selected.has(sport)}
                name="sports"
                type="checkbox"
                value={sport}
              />
              {copy.sports[sport]}
            </span>
            <select
              className="min-h-11 rounded-md border border-[var(--line)] bg-white px-3 text-sm"
              defaultValue={String(levels.get(sport) ?? 3)}
              name={`${sport}Level`}
            >
              {[1, 2, 3, 4, 5].map((level) => (
                <option key={level} value={level}>
                  {copy.levels[String(level)]}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      {formError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-[var(--danger)]">
          {formError}
        </p>
      ) : null}
      <AuthSubmitButton label={copy.submit} pendingLabel={copy.pending} />
    </form>
  );
}
