"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  primaryLabel: string;
  onPrimary?: () => void;
  primaryHref?: string;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  secondaryHref?: string;
  primaryIcon?: ReactNode;
  className?: string;
};

/**
 * Sticky action bar that floats above the iOS keyboard via visualViewport
 * and respects the iOS home-indicator safe-area inset.
 *
 * Math ported from Glamingo SetupMobileShell.tsx lines 17-34:
 *   offset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
 *
 * When the keyboard opens on iOS Safari, `visualViewport.height` shrinks and
 * `offsetTop` moves; we translate the bar up by the difference so the Next
 * button rides above the keyboard. The transform transition is disabled when
 * `prefers-reduced-motion: reduce` is active.
 *
 * The bar uses `position: fixed` so it stays pinned to the viewport bottom
 * regardless of content height. Page wrappers add bottom padding so the
 * scrollable area never gets occluded by the bar.
 *
 * Mobile: full-bleed edge-to-edge background. Desktop: edge-to-edge tinted
 * surface with content centered to max-w-xl, so the bar reads as its own
 * elevated plane on wider viewports.
 */
export function WizardStickyActionBar({
  primaryLabel,
  onPrimary,
  primaryHref,
  primaryDisabled,
  primaryLoading,
  secondaryLabel,
  onSecondary,
  secondaryHref,
  primaryIcon,
  className,
}: Props) {
  const t = useTranslations("onboarding.wizard");
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setPrefersReducedMotion(mql.matches);
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const offset = Math.max(
        0,
        window.innerHeight - vv.height - vv.offsetTop,
      );
      setKeyboardOffset(offset);
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  const resolvedSecondary = secondaryLabel ?? t("back");

  const buttonBase = {
    minHeight: 48,
    fontSize: 14,
    fontWeight: 600,
    borderRadius: "var(--r-pill)",
  } as const;

  return (
    <div
      className={cn("fixed inset-x-0 bottom-0 z-30", className)}
      style={{
        background: "color-mix(in oklch, var(--surface) 94%, transparent)",
        borderTop: "1px solid var(--line)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        paddingTop: 12,
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
        transform: `translateY(${-keyboardOffset}px)`,
        transition: prefersReducedMotion
          ? "none"
          : "transform var(--t-2) var(--ease)",
        boxShadow: "0 -10px 28px -18px rgba(14, 26, 31, 0.22)",
      }}
    >
      <div className="mx-auto grid w-full max-w-xl grid-cols-[1fr_1.6fr] gap-2 px-4 sm:gap-3 sm:px-6">
        {secondaryHref ? (
          <a
            href={secondaryHref}
            className="btn-s2m btn-secondary"
            style={buttonBase}
          >
            {resolvedSecondary}
          </a>
        ) : (
          <button
            type="button"
            onClick={onSecondary}
            className="btn-s2m btn-secondary"
            style={buttonBase}
            disabled={!onSecondary}
            aria-disabled={!onSecondary}
          >
            {resolvedSecondary}
          </button>
        )}
        {primaryHref && !primaryDisabled && !primaryLoading ? (
          <a
            href={primaryHref}
            aria-busy={primaryLoading}
            className="btn-s2m"
            style={buttonBase}
          >
            <span>{primaryLabel}</span>
            {primaryIcon}
          </a>
        ) : (
          <button
            type="button"
            onClick={onPrimary}
            disabled={primaryDisabled || primaryLoading}
            aria-disabled={primaryDisabled || primaryLoading}
            aria-busy={primaryLoading}
            aria-label={primaryLoading ? t("loading") : undefined}
            className="btn-s2m motion-reduce:transition-none"
            style={{
              ...buttonBase,
              opacity: primaryDisabled && !primaryLoading ? 0.5 : 1,
              cursor:
                primaryDisabled || primaryLoading ? "not-allowed" : "pointer",
              filter:
                primaryDisabled && !primaryLoading
                  ? "saturate(0.6)"
                  : undefined,
              gap: 6,
            }}
          >
            {primaryLoading ? (
              <>
                <Loader2
                  size={16}
                  aria-hidden="true"
                  className={
                    prefersReducedMotion ? undefined : "animate-spin"
                  }
                />
                <span>{primaryLabel}</span>
              </>
            ) : (
              <>
                <span>{primaryLabel}</span>
                {primaryIcon}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
