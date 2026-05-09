"use client";

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
 * Sticky action bar that floats above the iOS keyboard via visualViewport.
 *
 * Math ported from Glamingo SetupMobileShell.tsx lines 17-34:
 *   offset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
 *
 * When the keyboard opens on iOS Safari, `visualViewport.height` shrinks and
 * `offsetTop` moves; we translate the bar up by the difference so the Next
 * button rides above the keyboard.
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
  const [keyboardOffset, setKeyboardOffset] = useState(0);

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

  return (
    <div
      className={cn(
        "sticky right-0 bottom-0 left-0 z-30",
        className,
      )}
      style={{
        background:
          "color-mix(in oklch, var(--surface) 92%, transparent)",
        borderTop: "1px solid var(--line)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        padding: "10px 16px calc(env(safe-area-inset-bottom) + 12px)",
        transform: `translateY(${-keyboardOffset}px)`,
        transition: "transform var(--t-2) var(--ease)",
      }}
    >
      <div className="grid grid-cols-[1fr_1.6fr] gap-2">
        {secondaryHref ? (
          <a
            href={secondaryHref}
            className="btn-s2m btn-secondary"
            style={{ minHeight: 48, fontSize: 14 }}
          >
            {secondaryLabel ?? "Back"}
          </a>
        ) : (
          <button
            type="button"
            onClick={onSecondary}
            className="btn-s2m btn-secondary"
            style={{ minHeight: 48, fontSize: 14 }}
            disabled={!onSecondary && !secondaryHref}
          >
            {secondaryLabel ?? "Back"}
          </button>
        )}
        {primaryHref && !primaryDisabled ? (
          <a
            href={primaryHref}
            aria-busy={primaryLoading}
            className="btn-s2m"
            style={{ minHeight: 48, fontSize: 14 }}
          >
            {primaryLoading ? "…" : primaryLabel}
            {primaryIcon}
          </a>
        ) : (
          <button
            type="button"
            onClick={onPrimary}
            disabled={primaryDisabled || primaryLoading}
            aria-busy={primaryLoading}
            className="btn-s2m"
            style={{
              minHeight: 48,
              fontSize: 14,
              opacity: primaryDisabled ? 0.4 : 1,
              cursor: primaryDisabled ? "not-allowed" : "pointer",
            }}
          >
            {primaryLoading ? "…" : primaryLabel}
            {primaryIcon}
          </button>
        )}
      </div>
    </div>
  );
}
