"use client";

import { cn } from "@/lib/utils";

/**
 * AIMark - chevron-burst, NOT a sparkle/star.
 * Used everywhere AI is involved. Inherits color via currentColor.
 *
 * The actual visual is rendered by the global `.ai-mark` class
 * (see globals.css). This wrapper enforces sizing + a11y.
 */
type Props = {
  size?: number;
  className?: string;
  ariaLabel?: string;
};

export function AIMark({ size = 14, className, ariaLabel }: Props) {
  return (
    <span
      className={cn("ai-mark", className)}
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      style={{ width: size, height: size }}
    />
  );
}
