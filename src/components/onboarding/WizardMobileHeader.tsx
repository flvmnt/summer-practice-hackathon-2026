"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  step: number;
  total: number;
  title: string;
  subtitle?: string;
  /** Optional override for the step pill label (e.g. when caller already
   *  has translated copy). Defaults to a localized "Step n of N". */
  stepLabel?: string;
  /** Render a back chevron with a 44px touch target. Provide an href for
   *  navigation, or onBack for a callback. Hidden by default. */
  backHref?: string;
  onBack?: () => void;
  backAriaLabel?: string;
  className?: string;
  trailing?: ReactNode;
};

/**
 * Onboarding wizard header (mobile-first).
 *
 * Visual rhythm:
 *   row 1: optional back chevron + step pill + segmented progress bar
 *   row 2: page title (h1, display face)
 *   row 3: optional subtitle (body small, ink-muted)
 *
 * Progress segments transition with --t-2; `motion-reduce:` disables the
 * transition when `prefers-reduced-motion: reduce` is active.
 */
export function WizardMobileHeader({
  step,
  total,
  title,
  subtitle,
  stepLabel,
  backHref,
  onBack,
  backAriaLabel,
  className,
  trailing,
}: Props) {
  const t = useTranslations("onboarding.wizard");
  const safeStep = Math.max(1, Math.min(step, total));
  const resolvedStepLabel =
    stepLabel ?? t("stepOfTotal", { step: safeStep, total });
  const resolvedBackAria = backAriaLabel ?? t("backAria");
  const showBack = Boolean(backHref || onBack);

  const backStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
    marginLeft: -10,
    borderRadius: "var(--r-pill)",
    color: "var(--ink)",
    background: "transparent",
    transition: "background var(--t-1) var(--ease)",
  };

  const backChevron = showBack ? (
    backHref ? (
      <Link
        href={backHref}
        aria-label={resolvedBackAria}
        style={backStyle}
        className="motion-reduce:transition-none hover:bg-[var(--accent-tint)]"
      >
        <ChevronLeft size={22} aria-hidden="true" />
      </Link>
    ) : (
      <button
        type="button"
        onClick={onBack}
        aria-label={resolvedBackAria}
        style={backStyle}
        className="motion-reduce:transition-none hover:bg-[var(--accent-tint)]"
      >
        <ChevronLeft size={22} aria-hidden="true" />
      </button>
    )
  ) : null;

  return (
    <header className={cn("flex flex-col gap-3 px-1", className)}>
      <div className="flex items-center gap-2">
        {backChevron}
        <span
          className="mono inline-flex items-center px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{
            background: "var(--accent-tint)",
            color: "var(--accent-deep)",
            borderRadius: "var(--r-pill)",
            minHeight: 24,
          }}
        >
          {resolvedStepLabel}
        </span>
        <div
          role="progressbar"
          aria-label={t("progressLabel")}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={safeStep}
          aria-valuetext={resolvedStepLabel}
          className="ml-auto flex items-center gap-1.5"
        >
          {Array.from({ length: total }).map((_, i) => {
            const filled = i < safeStep;
            return (
              <span
                key={i}
                aria-hidden="true"
                style={{
                  width: 18,
                  height: 4,
                  borderRadius: "var(--r-pill)",
                  background: filled ? "var(--accent)" : "var(--line-2)",
                  transition: "background var(--t-2) var(--ease)",
                }}
                className="motion-reduce:transition-none"
              />
            );
          })}
        </div>
        {trailing ? <div className="ml-1">{trailing}</div> : null}
      </div>
      <h1
        className="display"
        style={{
          fontSize: 28,
          lineHeight: 1.1,
          letterSpacing: "-0.01em",
          color: "var(--ink)",
          margin: 0,
        }}
      >
        {title}
      </h1>
      {subtitle ? (
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.4,
            color: "var(--ink-muted)",
            margin: 0,
          }}
        >
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}
