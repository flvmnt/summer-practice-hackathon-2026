"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import type { AppLocale } from "@/i18n/routing";
import {
  onboardingProfileFormAction,
  type OnboardingProfileFormState,
} from "@/lib/onboarding-form-actions";

type ProfileFormCopy = {
  fullName: string;
  fullNamePlaceholder: string;
  bio: string;
  bioPlaceholder: string;
  submit: string;
  pending: string;
  genericError: string;
  unauthorized: string;
  fullNameRequired: string;
  fullNameInvalid: string;
  bioRequired: string;
  successTitle: string;
  successBody: string;
  continue: string;
};

const initialState: OnboardingProfileFormState = {};

function errorText(code: string | undefined, copy: ProfileFormCopy) {
  if (code === "full_name_required" || code === "full_name_too_long") {
    return copy.fullNameRequired;
  }

  if (code === "invalid_full_name") {
    return copy.fullNameInvalid;
  }

  if (code === "bio_required") {
    return copy.bioRequired;
  }

  if (code === "unauthorized") {
    return copy.unauthorized;
  }

  if (code) {
    return copy.genericError;
  }

  return undefined;
}

export function ProfileForm({
  copy,
  defaultBio,
  defaultFullName,
  locale,
}: {
  copy: ProfileFormCopy;
  defaultBio: string;
  defaultFullName: string;
  locale: AppLocale;
}) {
  const [state, formAction] = useActionState(onboardingProfileFormAction, initialState);
  const fullNameError = errorText(state.fieldErrors?.fullName, copy);
  const bioError = errorText(state.fieldErrors?.bio, copy);
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
      <input name="locale" type="hidden" value={locale} />
      <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
        <span>{copy.fullName}</span>
        <input
          aria-describedby={fullNameError ? "fullName-error" : undefined}
          aria-invalid={Boolean(fullNameError)}
          autoComplete="name"
          className="min-h-12 rounded-md border border-[var(--line)] bg-white px-3 text-base font-normal outline-none transition-colors focus:border-[var(--court)]"
          defaultValue={defaultFullName}
          maxLength={80}
          name="fullName"
          placeholder={copy.fullNamePlaceholder}
          required
        />
        {fullNameError ? (
          <span className="text-sm font-medium text-[var(--danger)]" id="fullName-error">
            {fullNameError}
          </span>
        ) : null}
      </label>
      <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
        <span>{copy.bio}</span>
        <textarea
          aria-describedby={bioError ? "bio-error" : undefined}
          aria-invalid={Boolean(bioError)}
          className="min-h-32 resize-y rounded-md border border-[var(--line)] bg-white px-3 py-3 text-base font-normal outline-none transition-colors focus:border-[var(--court)]"
          defaultValue={defaultBio}
          maxLength={800}
          name="bio"
          placeholder={copy.bioPlaceholder}
          required
        />
        {bioError ? (
          <span className="text-sm font-medium text-[var(--danger)]" id="bio-error">
            {bioError}
          </span>
        ) : null}
      </label>
      {formError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-[var(--danger)]">
          {formError}
        </p>
      ) : null}
      <AuthSubmitButton label={copy.submit} pendingLabel={copy.pending} />
    </form>
  );
}
