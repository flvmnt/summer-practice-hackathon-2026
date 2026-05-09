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
  if (code === "invalid_credentials") return copy.invalidCredentials;
  if (code === "rate_limited") return copy.rateLimited;
  if (code) return copy.genericError;
  return undefined;
}

export function LoginForm({
  copy,
  locale,
  showLabel,
  hideLabel,
}: {
  copy: LoginCopy;
  locale: AppLocale;
  showLabel: string;
  hideLabel: string;
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
        showPasswordLabel={showLabel}
        hidePasswordLabel={hideLabel}
      />
      <AuthField
        autoComplete="current-password"
        label={copy.password}
        minLength={8}
        name="password"
        placeholder={copy.passwordPlaceholder}
        type="password"
        showPasswordLabel={showLabel}
        hidePasswordLabel={hideLabel}
      />
      {formError ? (
        <p
          className="text-[13px] font-medium"
          style={{
            background: "var(--alert-soft)",
            color: "var(--alert)",
            padding: "10px 12px",
            borderRadius: "var(--r-card)",
          }}
          role="alert"
        >
          {formError}
        </p>
      ) : null}
      <AuthSubmitButton label={copy.submit} pendingLabel={copy.pending} />
    </form>
  );
}
