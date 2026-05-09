import { forwardRef, useId, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
};

export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { label, hint, error, className, containerClassName, id, children, ...rest },
  ref,
) {
  const auto = useId();
  const inputId = id ?? auto;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errId = error ? `${inputId}-err` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", containerClassName)}>
      {label ? (
        <label
          htmlFor={inputId}
          className="mono text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: "var(--ink-muted)" }}
        >
          {label}
        </label>
      ) : null}
      <div className="relative">
        <select
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "w-full text-[16px] leading-snug appearance-none",
            "border-[1.5px] focus:outline-none",
            className,
          )}
          style={{
            padding: "12px 40px 12px 14px",
            background: "var(--surface)",
            color: "var(--ink)",
            borderColor: error ? "var(--alert)" : "var(--line)",
            borderRadius: "var(--r-card)",
            minHeight: 48,
            transition: "border-color var(--t-1) var(--ease)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = error
              ? "var(--alert)"
              : "var(--accent)";
            e.currentTarget.style.boxShadow = `0 0 0 2px ${
              error ? "var(--alert-soft)" : "var(--accent-soft)"
            }`;
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error
              ? "var(--alert)"
              : "var(--line)";
            e.currentTarget.style.boxShadow = "none";
            rest.onBlur?.(e);
          }}
          {...rest}
        >
          {children}
        </select>
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"
          style={{ color: "var(--ink-muted)", fontSize: 16 }}
        >
          ▾
        </span>
      </div>
      {error ? (
        <p
          id={errId}
          className="text-[12px]"
          style={{ color: "var(--alert)" }}
        >
          {error}
        </p>
      ) : hint ? (
        <p
          id={hintId}
          className="text-[12px]"
          style={{ color: "var(--ink-muted)" }}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
});
