"use client";

import { useId, useMemo } from "react";
import { cn } from "@/lib/utils";

type Option<V extends string> = {
  value: V;
  label: string;
};

type Props<V extends string> = {
  options: ReadonlyArray<Option<V>>;
  value: V;
  onChange: (next: V) => void;
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
};

export function SegmentedControl<V extends string>({
  options,
  value,
  onChange,
  size = "md",
  className,
  ariaLabel,
}: Props<V>) {
  const groupId = useId();
  const activeIndex = useMemo(
    () => Math.max(0, options.findIndex((o) => o.value === value)),
    [options, value],
  );
  const widthPct = options.length > 0 ? 100 / options.length : 100;
  const small = size === "sm";

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("relative flex gap-0.5", className)}
      style={{
        padding: 3,
        background: "var(--surface-2)",
        borderRadius: 10,
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          top: 3,
          bottom: 3,
          left: 3,
          width: `calc(${widthPct}% - 6px / ${options.length})`,
          background: "var(--surface)",
          borderRadius: 8,
          boxShadow: "var(--shadow-1)",
          transform: `translateX(calc(${activeIndex} * 100%))`,
          transition: "transform var(--t-2) var(--ease)",
        }}
      />
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            id={`${groupId}-${opt.value}`}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative z-[1] flex-1 cursor-pointer text-center font-semibold transition-colors",
              small ? "px-1 py-1.5 text-[11px]" : "px-1 py-2 text-xs",
            )}
            style={{
              color: selected ? "var(--ink)" : "var(--ink-muted)",
              minHeight: small ? 28 : 32,
              borderRadius: 8,
              background: "transparent",
              border: 0,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
