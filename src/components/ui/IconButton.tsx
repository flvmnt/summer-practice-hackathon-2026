import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "ghost" | "solid";

type Props = {
  variant?: Variant;
  ariaLabel: string;
  children: ReactNode;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label" | "children" | "className">;

export function IconButton({
  variant = "ghost",
  ariaLabel,
  children,
  className,
  type,
  ...rest
}: Props) {
  return (
    <button
      type={type ?? "button"}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 disabled:opacity-40",
        variant === "ghost" && "bg-transparent text-[var(--ink)] hover:bg-[var(--surface-2)]",
        variant === "solid" && "bg-[var(--accent)] text-[var(--on-accent)] hover:bg-[var(--accent-deep)]",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
