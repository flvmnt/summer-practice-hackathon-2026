"use client";

import { useId, useState, type InputHTMLAttributes } from "react";
import { Glyph } from "@/components/ui/Glyph";

type AuthFieldProps = {
  autoComplete?: string;
  error?: string;
  label: string;
  minLength?: number;
  name: string;
  placeholder: string;
  type?: string;
  defaultValue?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
  onValueChange?: (value: string) => void;
};

/**
 * AuthField — direction B styling. Uses the Wave 0 Input visuals via inline
 * styles so it composes well inside auth cards. 16px input text (no iOS zoom),
 * accent focus ring, mono uppercase label, optional show/hide password toggle.
 */
export function AuthField({
  autoComplete,
  error,
  label,
  minLength,
  name,
  placeholder,
  type = "text",
  defaultValue,
  inputMode,
  showPasswordLabel = "Show password",
  hidePasswordLabel = "Hide password",
  onValueChange,
}: AuthFieldProps) {
  const id = useId();
  const errId = error ? `${id}-err` : undefined;
  const isPassword = type === "password";
  const [reveal, setReveal] = useState(false);
  const renderType = isPassword && reveal ? "text" : type;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="mono text-[10px] font-bold uppercase"
        style={{ color: "var(--ink-muted)", letterSpacing: "0.12em" }}
      >
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={errId}
          autoComplete={autoComplete}
          defaultValue={defaultValue}
          inputMode={inputMode}
          minLength={minLength}
          name={name}
          placeholder={placeholder}
          required
          type={renderType}
          className="w-full text-[16px] leading-snug focus:outline-none"
          style={{
            padding: isPassword ? "12px 48px 12px 14px" : "12px 14px",
            background: "var(--surface)",
            color: "var(--ink)",
            border: "1.5px solid",
            borderColor: error ? "var(--alert)" : "var(--line)",
            borderRadius: "var(--r-card)",
            minHeight: 48,
            transition: "border-color var(--t-1) var(--ease), box-shadow var(--t-1) var(--ease)",
          }}
          onChange={
            onValueChange
              ? (e) => onValueChange(e.currentTarget.value)
              : undefined
          }
          onFocus={(e) => {
            e.currentTarget.style.borderColor = error
              ? "var(--alert)"
              : "var(--accent)";
            e.currentTarget.style.boxShadow = `0 0 0 3px ${
              error ? "var(--alert-soft)" : "var(--accent-soft)"
            }`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error
              ? "var(--alert)"
              : "var(--line)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? hidePasswordLabel : showPasswordLabel}
            aria-pressed={reveal}
            className="absolute inline-flex items-center justify-center"
            style={{
              right: 6,
              top: "50%",
              transform: "translateY(-50%)",
              height: 36,
              width: 36,
              borderRadius: 999,
              background: "transparent",
              color: "var(--ink-muted)",
              border: 0,
              cursor: "pointer",
            }}
          >
            <Glyph.lock size={18} />
          </button>
        ) : null}
      </div>
      {error ? (
        <p
          id={errId}
          className="text-[12px] font-medium"
          style={{ color: "var(--alert)" }}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
