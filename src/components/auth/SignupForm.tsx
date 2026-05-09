"use client";

import { useActionState, useState } from "react";
import { AuthField } from "@/components/auth/AuthField";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { RecoveryCodeReveal } from "@/components/auth/RecoveryCodeReveal";
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
  // Legacy keys present in messages - kept optional for forward-compat.
  recoveryTitle?: string;
  recoveryBody?: string;
  recoveryWarning?: string;
  continue?: string;
};

type RevealCopy = {
  eyebrow: string;
  title: string;
  body: string;
  label: string;
  copy: string;
  copied: string;
  download: string;
  downloaded: string;
  savedConfirm: string;
  continue: string;
  privacy: string;
  toastCopiedTitle: string;
  toastCopiedBody: string;
  toastDownloadedTitle: string;
  toastDownloadedBody: string;
};

const initialState: AuthFormState = {};

function errorText(code: string | undefined, copy: SignupCopy) {
  if (code === "username_taken") return copy.usernameTaken;
  if (code) return copy.genericError;
  return undefined;
}

export function SignupForm({
  copy,
  locale,
  revealCopy,
  showLabel,
  hideLabel,
}: {
  copy: SignupCopy;
  locale: AppLocale;
  revealCopy: RevealCopy;
  showLabel: string;
  hideLabel: string;
}) {
  const [state, formAction] = useActionState(signupFormAction, initialState);
  const [pendingUsername, setPendingUsername] = useState("");
  const usernameError = errorText(state.fieldErrors?.username, copy);
  const formError = errorText(state.error, copy);

  if (state.recoveryCode) {
    return (
      <RecoveryCodeReveal
        recoveryCode={state.recoveryCode}
        username={pendingUsername}
        locale={locale}
        copy={revealCopy}
      />
    );
  }

  return (
    <form
      action={formAction}
      className="grid gap-4"
      onInput={(event) => {
        const target = event.target as HTMLInputElement;
        if (target?.name === "username") {
          setPendingUsername(target.value);
        }
      }}
    >
      <input name="locale" type="hidden" value={locale} />
      <AuthField
        autoComplete="username"
        error={usernameError}
        label={copy.username}
        name="username"
        placeholder={copy.usernamePlaceholder}
        showPasswordLabel={showLabel}
        hidePasswordLabel={hideLabel}
      />
      <AuthField
        autoComplete="new-password"
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
