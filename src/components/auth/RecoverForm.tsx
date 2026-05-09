"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthField } from "@/components/auth/AuthField";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import type { AppLocale } from "@/i18n/routing";
import { recoverFormAction, type AuthFormState } from "@/lib/auth-form-actions";

type RecoverCopy = {
  username: string;
  usernamePlaceholder: string;
  recoveryCode: string;
  recoveryCodePlaceholder: string;
  newPassword: string;
  newPasswordPlaceholder: string;
  submit: string;
  pending: string;
  genericError: string;
  invalidRecovery: string;
  rateLimited: string;
  successTitle: string;
  successBody: string;
  recoveryWarning: string;
  continue: string;
};

const initialState: AuthFormState = {};

function errorText(code: string | undefined, copy: RecoverCopy) {
  if (code === "invalid_recovery") {
    return copy.invalidRecovery;
  }

  if (code === "rate_limited") {
    return copy.rateLimited;
  }

  if (code) {
    return copy.genericError;
  }

  return undefined;
}

export function RecoverForm({
  copy,
  locale,
}: {
  copy: RecoverCopy;
  locale: AppLocale;
}) {
  const [state, formAction] = useActionState(recoverFormAction, initialState);
  const formError = errorText(state.error, copy);

  if (state.newRecoveryCode) {
    return (
      <div className="grid gap-5">
        <div className="rounded-md border border-[var(--line)] bg-[var(--mint)] p-4">
          <h2 className="text-lg font-bold">{copy.successTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {copy.successBody}
          </p>
          <code className="mt-4 block overflow-x-auto rounded-md bg-white px-3 py-3 text-center text-lg font-bold tracking-[0.12em] text-[var(--navy)]">
            {state.newRecoveryCode}
          </code>
          <p className="mt-3 text-sm font-semibold text-[var(--danger)]">
            {copy.recoveryWarning}
          </p>
        </div>
        <Link
          className="inline-flex min-h-12 items-center justify-center rounded-md bg-[var(--lime)] px-5 text-sm font-semibold text-[var(--navy)]"
          href={`/${locale}/today`}
        >
          {copy.continue}
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-4">
      <AuthField
        autoComplete="username"
        label={copy.username}
        name="username"
        placeholder={copy.usernamePlaceholder}
      />
      <AuthField
        autoComplete="one-time-code"
        label={copy.recoveryCode}
        name="recoveryCode"
        placeholder={copy.recoveryCodePlaceholder}
      />
      <AuthField
        autoComplete="new-password"
        label={copy.newPassword}
        minLength={8}
        name="newPassword"
        placeholder={copy.newPasswordPlaceholder}
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
