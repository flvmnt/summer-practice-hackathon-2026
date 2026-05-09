"use client";

import { useId, type ChangeEvent } from "react";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  onChange: (next: number) => void;
  min: number;
  max: number;
  step?: number;
  label?: string;
  hint?: string;
  unit?: string;
  className?: string;
  ariaLabel?: string;
};

export function Slider({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  hint,
  unit,
  className,
  ariaLabel,
}: Props) {
  const id = useId();
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value);
    if (!Number.isNaN(next)) onChange(next);
  };

  return (
    <div className={cn("w-full", className)}>
      {label ? (
        <div className="flex items-end justify-between">
          <label
            htmlFor={id}
            className="mono text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: "var(--ink-muted)" }}
          >
            {label}
          </label>
          <span
            className="mono"
            style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)" }}
          >
            {value}
            {unit ? (
              <span
                className="ml-1 text-xs"
                style={{ color: "var(--ink-muted)" }}
              >
                {unit}
              </span>
            ) : null}
          </span>
        </div>
      ) : null}
      <div className="relative mt-2 h-11 w-full">
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-0 left-0 -translate-y-1/2 rounded-full"
          style={{ height: 4, background: "var(--line)" }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 rounded-full"
          style={{ height: 4, width: `${pct}%`, background: "var(--accent)" }}
        />
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          aria-label={ariaLabel ?? label}
          className="su-slider absolute inset-0 w-full cursor-pointer appearance-none bg-transparent"
          style={{ accentColor: "var(--accent)" }}
        />
      </div>
      {hint ? (
        <div
          className="mono mt-1 flex justify-between text-[11px]"
          style={{ color: "var(--ink-muted)" }}
        >
          <span>{hint}</span>
        </div>
      ) : null}
      <SliderThumbStyles />
    </div>
  );
}

const SLIDER_THUMB_CSS = `
.su-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: #fff;
  border: 1.5px solid var(--accent);
  box-shadow: var(--shadow-2);
  cursor: pointer;
}
.su-slider::-moz-range-thumb {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: #fff;
  border: 1.5px solid var(--accent);
  box-shadow: var(--shadow-2);
  cursor: pointer;
}
.su-slider:focus-visible {
  outline: 3px solid var(--field);
  outline-offset: 6px;
  border-radius: 999px;
}
`;

let stylesInjected = false;

function SliderThumbStyles() {
  // Inject once per page lifetime; a static literal - no untrusted content.
  if (typeof document !== "undefined" && !stylesInjected) {
    const id = "su-slider-thumb-styles";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = SLIDER_THUMB_CSS;
      document.head.appendChild(el);
    }
    stylesInjected = true;
  }
  return null;
}
