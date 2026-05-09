import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "alt" | "accent" | "field" | "live";

type Props = {
  variant?: Variant;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function Pill({ variant = "default", icon, children, className }: Props) {
  const variantClass =
    variant === "alt"
      ? "alt"
      : variant === "accent"
        ? "accent"
        : variant === "field"
          ? "field"
          : variant === "live"
            ? "live"
            : "";
  return (
    <span className={cn("pill", variantClass, className)}>
      {icon}
      {children}
    </span>
  );
}
