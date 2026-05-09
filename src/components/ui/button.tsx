import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md text-sm font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-offset-3 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--accent)] text-[var(--on-accent)] hover:bg-[var(--accent-deep)]",
        secondary:
          "border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-2)]",
        destructive: "bg-[var(--danger)] text-white hover:bg-[#b91c1c]",
        ghost: "text-[var(--ink)] hover:bg-[var(--mint)]",
      },
      size: {
        default: "px-4 py-2",
        sm: "min-h-9 px-3",
        lg: "min-h-12 px-5",
        icon: "size-11 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      data-slot="button"
      {...props}
    />
  );
}

export { buttonVariants };
