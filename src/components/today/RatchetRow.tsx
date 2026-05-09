"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  icon: ReactNode;
  count: number;
  label: string;
  delay?: number;
  active?: boolean;
  className?: string;
};

const reduceMotion = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Today / matching funnel row with animated count-up.
 * Ported from screens.jsx `RatchetRow`.
 */
export function RatchetRow({
  icon,
  count,
  label,
  delay = 0,
  active,
  className,
}: Props) {
  // Always 0 at first render to keep SSR + client markup identical;
  // the effect schedules the animation (or jumps to `count` if motion is reduced).
  const [n, setN] = useState<number>(0);

  useEffect(() => {
    if (reduceMotion()) {
      // Defer to a frame to avoid synchronous setState-in-effect.
      const id = requestAnimationFrame(() => setN(count));
      return () => cancelAnimationFrame(id);
    }
    let cancelled = false;
    let raf = 0;
    const start = performance.now() + delay;
    const step = (now: number) => {
      if (cancelled) return;
      if (now < start) {
        raf = requestAnimationFrame(step);
        return;
      }
      const p = Math.min(1, (now - start) / 500);
      setN(Math.round(count * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [count, delay]);

  return (
    <div
      className={cn("flex items-center gap-3.5 px-3.5 py-2.5", className)}
      style={{
        background: active ? "var(--accent-soft)" : "var(--surface-2)",
        borderRadius: 14,
        border: active
          ? "1px solid color-mix(in oklch, var(--accent) 30%, transparent)"
          : "1px solid transparent",
      }}
    >
      <span
        className="inline-flex items-center justify-center"
        style={{
          fontSize: 18,
          color: active ? "var(--accent-deep)" : "var(--ink-muted)",
          flex: "none",
        }}
        aria-hidden
      >
        {icon}
      </span>
      <div
        className="mono"
        style={{
          fontSize: 22,
          fontWeight: 700,
          minWidth: 36,
          color: active ? "var(--accent-deep)" : "var(--ink)",
        }}
      >
        {n}
      </div>
      <div className="text-[14px]" style={{ color: "var(--ink-muted)" }}>
        {label}
      </div>
    </div>
  );
}
