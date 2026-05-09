"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import type { AppLocale } from "@/i18n/routing";
import {
  onboardingLocationFormAction,
  type OnboardingLocationFormState,
} from "@/lib/onboarding-form-actions";
import { DISTANCE_OPTIONS_KM } from "@/lib/sports";

type LocationFormCopy = {
  city: string;
  cityPlaceholder: string;
  latitude: string;
  longitude: string;
  maxDistance: string;
  km: string;
  submit: string;
  pending: string;
  genericError: string;
  unauthorized: string;
  cityRequired: string;
  invalidLatitude: string;
  invalidLongitude: string;
  successTitle: string;
  successBody: string;
  continue: string;
};

const initialState: OnboardingLocationFormState = {};

function errorText(code: string | undefined, copy: LocationFormCopy) {
  if (code === "city_required") {
    return copy.cityRequired;
  }

  if (code === "invalid_latitude") {
    return copy.invalidLatitude;
  }

  if (code === "invalid_longitude") {
    return copy.invalidLongitude;
  }

  if (code === "unauthorized") {
    return copy.unauthorized;
  }

  if (code) {
    return copy.genericError;
  }

  return undefined;
}

export function LocationForm({
  copy,
  defaultCity,
  defaultHomeLat,
  defaultHomeLng,
  defaultMaxDistanceKm,
  locale,
}: {
  copy: LocationFormCopy;
  defaultCity: string;
  defaultHomeLat: string;
  defaultHomeLng: string;
  defaultMaxDistanceKm: number;
  locale: AppLocale;
}) {
  const [state, formAction] = useActionState(onboardingLocationFormAction, initialState);
  const cityError = errorText(state.fieldErrors?.city, copy);
  const latError = errorText(state.fieldErrors?.homeLat, copy);
  const lngError = errorText(state.fieldErrors?.homeLng, copy);
  const formError = errorText(state.error, copy);

  if (state.saved) {
    return (
      <div className="rounded-md border border-[var(--line)] bg-[var(--mint)] p-4">
        <h2 className="text-lg font-bold">{copy.successTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          {copy.successBody}
        </p>
        <Link
          className="mt-4 inline-flex min-h-12 items-center justify-center rounded-md bg-[var(--lime)] px-5 text-sm font-semibold text-[var(--navy)]"
          href={`/${locale}/today`}
        >
          {copy.continue}
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-4">
      <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
        <span>{copy.city}</span>
        <input
          aria-describedby={cityError ? "city-error" : undefined}
          aria-invalid={Boolean(cityError)}
          autoComplete="address-level2"
          className="min-h-12 rounded-md border border-[var(--line)] bg-white px-3 text-base font-normal outline-none transition-colors focus:border-[var(--court)]"
          defaultValue={defaultCity}
          maxLength={100}
          name="city"
          placeholder={copy.cityPlaceholder}
          required
        />
        {cityError ? (
          <span className="text-sm font-medium text-[var(--danger)]" id="city-error">
            {cityError}
          </span>
        ) : null}
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
          <span>{copy.latitude}</span>
          <input
            aria-describedby={latError ? "homeLat-error" : undefined}
            aria-invalid={Boolean(latError)}
            className="min-h-12 rounded-md border border-[var(--line)] bg-white px-3 text-base font-normal outline-none transition-colors focus:border-[var(--court)]"
            defaultValue={defaultHomeLat}
            inputMode="decimal"
            name="homeLat"
            placeholder="45.7489"
            required
            step="0.000001"
            type="number"
          />
          {latError ? (
            <span
              className="text-sm font-medium text-[var(--danger)]"
              id="homeLat-error"
            >
              {latError}
            </span>
          ) : null}
        </label>
        <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
          <span>{copy.longitude}</span>
          <input
            aria-describedby={lngError ? "homeLng-error" : undefined}
            aria-invalid={Boolean(lngError)}
            className="min-h-12 rounded-md border border-[var(--line)] bg-white px-3 text-base font-normal outline-none transition-colors focus:border-[var(--court)]"
            defaultValue={defaultHomeLng}
            inputMode="decimal"
            name="homeLng"
            placeholder="21.2087"
            required
            step="0.000001"
            type="number"
          />
          {lngError ? (
            <span
              className="text-sm font-medium text-[var(--danger)]"
              id="homeLng-error"
            >
              {lngError}
            </span>
          ) : null}
        </label>
      </div>
      <fieldset className="grid gap-2">
        <legend className="text-sm font-semibold text-[var(--ink)]">
          {copy.maxDistance}
        </legend>
        <div className="grid grid-cols-4 gap-2">
          {DISTANCE_OPTIONS_KM.map((distance) => (
            <label
              className="flex min-h-11 items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-white px-2 text-sm font-semibold"
              key={distance}
            >
              <input
                className="accent-[var(--navy)]"
                defaultChecked={defaultMaxDistanceKm === distance}
                name="maxDistanceKm"
                type="radio"
                value={distance}
              />
              {distance}
              {copy.km}
            </label>
          ))}
        </div>
      </fieldset>
      {formError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-[var(--danger)]">
          {formError}
        </p>
      ) : null}
      <AuthSubmitButton label={copy.submit} pendingLabel={copy.pending} />
    </form>
  );
}
