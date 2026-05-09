"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthField } from "@/components/auth/AuthField";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import type { AppLocale } from "@/i18n/routing";
import { signupFormAction, type AuthFormState } from "@/lib/auth-form-actions";

type SignupCopy = {
  username: string;
  usernamePlaceholder: string;
  password: string;
  passwordPlaceholder: string;
  submit: string;
  pending: string;
  genericError: string;
  usernameTaken: string;
  recoveryTitle: string;
  recoveryBody: string;
  recoveryWarning: string;
  continue: string;
};

const initialState: AuthFormState = {};

function errorText(code: string | undefined, copy: SignupCopy) {
  if (code === "username_taken") {
    return copy.usernameTaken;
  }

  if (code) {
    return copy.genericError;
  }

  return undefined;
}

export function SignupForm({
  copy,
  locale,
}: {
  copy: SignupCopy;
  locale: AppLocale;
}) {
  const [state, formAction] = useActionState(signupFormAction, initialState);
  const usernameError = errorText(state.fieldErrors?.username, copy);
  const formError = errorText(state.error, copy);

  if (state.recoveryCode) {
    return (
      <div className="grid gap-5">
        <div className="rounded-md border border-[var(--line)] bg-[var(--mint)] p-4">
          <h2 className="text-lg font-bold">{copy.recoveryTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {copy.recoveryBody}
          </p>
          <code className="mt-4 block overflow-x-auto rounded-md bg-white px-3 py-3 text-center text-lg font-bold tracking-[0.12em] text-[var(--navy)]">
            {state.recoveryCode}
          </code>
          <p className="mt-3 text-sm font-semibold text-[var(--danger)]">
            {copy.recoveryWarning}
          </p>
        </div>
        <Link
          className="inline-flex min-h-12 items-center justify-center rounded-md bg-[var(--lime)] px-5 text-sm font-semibold text-[var(--navy)]"
          href={`/${locale}/onboarding/profile`}
        >
          {copy.continue}
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-4">
      <input name="locale" type="hidden" value={locale} />
      <AuthField
        autoComplete="username"
        error={usernameError}
        label={copy.username}
        name="username"
        placeholder={copy.usernamePlaceholder}
      />
      <AuthField
        autoComplete="new-password"
        label={copy.password}
        minLength={8}
        name="password"
        placeholder={copy.passwordPlaceholder}
        type="password"
      />
      {formError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-[var(--danger)]">
          {formError}
        </p>
      ) : null}
      <AuthSubmitButton label={copy.submit} pendingLabel={copy.pending} />
    </form>
  );
}
