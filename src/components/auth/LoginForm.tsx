"use client";

import { useActionState } from "react";
import { AuthField } from "@/components/auth/AuthField";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import type { AppLocale } from "@/i18n/routing";
import { loginFormAction, type AuthFormState } from "@/lib/auth-form-actions";

type LoginCopy = {
  username: string;
  usernamePlaceholder: string;
  password: string;
  passwordPlaceholder: string;
  submit: string;
  pending: string;
  genericError: string;
  invalidCredentials: string;
  rateLimited: string;
};

const initialState: AuthFormState = {};

function errorText(code: string | undefined, copy: LoginCopy) {
  if (code === "invalid_credentials") {
    return copy.invalidCredentials;
  }

  if (code === "rate_limited") {
    return copy.rateLimited;
  }

  if (code) {
    return copy.genericError;
  }

  return undefined;
}

export function LoginForm({
  copy,
  locale,
}: {
  copy: LoginCopy;
  locale: AppLocale;
}) {
  const [state, formAction] = useActionState(loginFormAction, initialState);
  const formError = errorText(state.error, copy);

  return (
    <form action={formAction} className="grid gap-4">
      <input name="locale" type="hidden" value={locale} />
      <AuthField
        autoComplete="username"
        label={copy.username}
        name="username"
        placeholder={copy.usernamePlaceholder}
      />
      <AuthField
        autoComplete="current-password"
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
