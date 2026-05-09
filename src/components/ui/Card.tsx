import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "card" | "surface" | "shell";

type Props = {
  as?: ElementType;
  variant?: Variant;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
} & Omit<HTMLAttributes<HTMLElement>, "style" | "className">;

const variantStyle: Record<Variant, CSSProperties> = {
  card: {
    background: "var(--surface)",
    borderRadius: "var(--r-card)",
    border: "1px solid var(--line)",
    boxShadow: "var(--shadow-1)",
  },
  surface: {
    background: "var(--surface)",
    borderRadius: "var(--r-surface)",
    border: "1px solid var(--line)",
    boxShadow: "var(--shadow-3)",
  },
  shell: {
    background: "var(--surface)",
    borderRadius: "var(--r-shell)",
    border: "1px solid var(--line)",
    boxShadow: "var(--shadow-3)",
  },
};

export function Card({
  as,
  variant = "card",
  children,
  className,
  style,
  ...rest
}: Props) {
  const Tag = (as ?? "div") as ElementType;
  return (
    <Tag
      className={cn(className)}
      style={{ ...variantStyle[variant], ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
