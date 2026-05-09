"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

type Item<V extends string> = {
  id: V;
  label: string;
};

type Props<V extends string> = {
  value: V;
  onChange: (next: V) => void;
  items: ReadonlyArray<Item<V>>;
  className?: string;
  ariaLabel?: string;
};

export function Tabs<V extends string>({
  value,
  onChange,
  items,
  className,
  ariaLabel,
}: Props<V>) {
  const groupId = useId();
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn("tabs", className)}
    >
      {items.map((item) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`${groupId}-${item.id}`}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            className={cn(
              "tab",
              "min-h-11 border-0 bg-transparent",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
