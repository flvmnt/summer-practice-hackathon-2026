import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

type Props = {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  className?: string;
  ariaLabel?: string;
};

/**
 * Skeleton — wraps the global `.skel` shimmer class.
 * Use to indicate loading state in cards, lists, hero blocks, etc.
 */
export function Skeleton({
  width,
  height,
  radius,
  className,
  ariaLabel = "Loading",
}: Props) {
  const style: CSSProperties = {
    width: width ?? "100%",
    height: height ?? 12,
    ...(radius !== undefined ? { borderRadius: radius } : undefined),
  };
  return (
    <span
      role="status"
      aria-label={ariaLabel}
      aria-live="polite"
      className={cn("skel block", className)}
      style={style}
    />
  );
}
