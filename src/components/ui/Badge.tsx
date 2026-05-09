import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "field" | "accent" | "alert";

type Props = {
  variant?: Variant;
  children?: ReactNode;
  className?: string;
};

const variantStyle: Record<Variant, CSSProperties> = {
  default: {
    background: "var(--surface-2)",
    color: "var(--ink-2)",
    boxShadow: "inset 0 0 0 1px var(--line)",
  },
  field: {
    background: "var(--field-soft)",
    color: "var(--field)",
  },
  accent: {
    background: "var(--accent-soft)",
    color: "var(--accent-deep)",
  },
  alert: {
    background: "var(--alert-soft)",
    color: "var(--alert)",
  },
};

export function Badge({ variant = "default", children, className }: Props) {
  return (
    <span
      className={cn(
        "mono inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]",
        className,
      )}
      style={{ ...variantStyle[variant], borderRadius: 6 }}
    >
      {children}
    </span>
  );
}
