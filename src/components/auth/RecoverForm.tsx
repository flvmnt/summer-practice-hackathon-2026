"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { AuthField } from "@/components/auth/AuthField";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { Glyph } from "@/components/ui/Glyph";
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

type StepCopy = {
  step1: string;
  step2: string;
  step3: string;
};

const initialState: AuthFormState = {};

function errorText(code: string | undefined, copy: RecoverCopy) {
  if (code === "invalid_recovery") return copy.invalidRecovery;
  if (code === "rate_limited") return copy.rateLimited;
  if (code) return copy.genericError;
  return undefined;
}

function StepRail({ active, steps }: { active: 1 | 2 | 3; steps: StepCopy }) {
  const labels: Array<{ n: 1 | 2 | 3; label: string }> = [
    { n: 1, label: steps.step1 },
    { n: 2, label: steps.step2 },
    { n: 3, label: steps.step3 },
  ];
  return (
    <ol
      className="mono flex items-center gap-1.5 text-[10px] font-bold uppercase"
      style={{ letterSpacing: "0.12em" }}
      aria-label="Recovery steps"
    >
      {labels.map((s, i) => {
        const state = s.n < active ? "done" : s.n === active ? "active" : "todo";
        return (
          <li key={s.n} className="flex items-center gap-1.5">
            <span
              style={{
                color:
                  state === "active"
                    ? "var(--accent-deep)"
                    : state === "done"
                      ? "var(--field)"
                      : "var(--ink-faint)",
              }}
            >
              {s.label}
            </span>
            {i < labels.length - 1 ? (
              <span
                aria-hidden
                style={{
                  width: 16,
                  height: 2,
                  borderRadius: 2,
                  background: state === "done" ? "var(--field)" : "var(--line-2)",
                }}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

export function RecoverForm({
  copy,
  locale,
  steps,
  showLabel,
  hideLabel,
}: {
  copy: RecoverCopy;
  locale: AppLocale;
  steps: StepCopy;
  showLabel: string;
  hideLabel: string;
}) {
  const [state, formAction] = useActionState(recoverFormAction, initialState);
  const formError = errorText(state.error, copy);
  const [username, setUsername] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  // Stage 1 = identify (username + recovery code). Stage 2 = set new password.
  // Both fields must be filled before the password field is revealed so the
  // user can't see step 2 before establishing identity. The action still
  // verifies the recovery code server-side; this is a UX gate, not a security
  // boundary.
  const stage: "identify" | "verified" =
    username.trim().length > 0 && recoveryCode.trim().length >= 4
      ? "verified"
      : "identify";

  if (state.newRecoveryCode) {
    // Step 3 — success
    return (
      <div className="grid gap-5">
        <StepRail active={3} steps={steps} />
        <div
          className="grid gap-2"
          style={{
            padding: "20px 18px",
            background: "var(--field-soft)",
            border: "1px solid color-mix(in oklch, var(--field) 24%, transparent)",
            borderRadius: "var(--r-surface)",
          }}
        >
          <h2 className="display" style={{ fontSize: 22, lineHeight: 1.1 }}>
            {copy.successTitle}
          </h2>
          <p className="text-[14px]" style={{ color: "var(--ink-2)", lineHeight: 1.5 }}>
            {copy.successBody}
          </p>
          <code
            className="mono mt-2 block overflow-x-auto px-3 py-3 text-center"
            style={{
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: "0.16em",
              background: "var(--surface)",
              color: "var(--ink)",
              borderRadius: "var(--r-card)",
              border: "1px solid var(--line-2)",
            }}
          >
            {state.newRecoveryCode}
          </code>
          <p className="text-[12px] font-medium" style={{ color: "var(--alert)" }}>
            {copy.recoveryWarning}
          </p>
        </div>
        <Link
          className="btn-s2m"
          href={`/${locale}/login`}
          style={{ width: "100%" }}
        >
          {copy.continue}
        </Link>
      </div>
    );
  }

  // Step 2 (new password) is hidden until the user has filled in both
  // username + recovery code. The action still verifies the code on submit;
  // this is a visual gate so the password field doesn't render before
  // identity is established.
  return (
    <form action={formAction} className="grid gap-4">
      <StepRail active={stage === "verified" ? 2 : 1} steps={steps} />
      <AuthField
        autoComplete="username"
        label={copy.username}
        name="username"
        onValueChange={setUsername}
        placeholder={copy.usernamePlaceholder}
        showPasswordLabel={showLabel}
        hidePasswordLabel={hideLabel}
      />
      <AuthField
        autoComplete="one-time-code"
        label={copy.recoveryCode}
        name="recoveryCode"
        onValueChange={setRecoveryCode}
        placeholder={copy.recoveryCodePlaceholder}
        showPasswordLabel={showLabel}
        hidePasswordLabel={hideLabel}
      />
      {stage === "verified" ? (
        <>
          <div
            className="my-1"
            aria-hidden
            style={{ height: 1, background: "var(--line)" }}
          />
          <p
            className="mono text-[10px] font-bold uppercase"
            style={{ color: "var(--ink-muted)", letterSpacing: "0.12em" }}
          >
            {steps.step2}
          </p>
          <AuthField
            autoComplete="new-password"
            label={copy.newPassword}
            minLength={8}
            name="newPassword"
            placeholder={copy.newPasswordPlaceholder}
            type="password"
            showPasswordLabel={showLabel}
            hidePasswordLabel={hideLabel}
          />
        </>
      ) : null}
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
      <AuthSubmitButton
        label={copy.submit}
        pendingLabel={copy.pending}
        disabled={stage !== "verified"}
      />
    </form>
  );
}
