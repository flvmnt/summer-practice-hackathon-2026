"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  text: string;
  active?: boolean;
  speedMs?: number;
  className?: string;
};

/**
 * Animated typewriter-on. Caret in var(--accent).
 * When active=false (or `prefers-reduced-motion`), renders the full text immediately.
 */
export function TypeOn({ text, active = true, speedMs = 28, className }: Props) {
  // Render the full text on the server + first client render to avoid hydration
  // mismatch; the effect kicks off the animation (or jumps to full length when
  // motion is reduced).
  const [n, setN] = useState<number>(() => text.length);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!active || reduce) {
      const id = requestAnimationFrame(() => setN(text.length));
      return () => cancelAnimationFrame(id);
    }
    let i = 0;
    // Reset on a frame so we don't synchronously setState in the effect body.
    const reset = requestAnimationFrame(() => setN(0));
    const id = window.setInterval(() => {
      i += 1;
      setN(i);
      if (i >= text.length) window.clearInterval(id);
    }, speedMs);
    return () => {
      cancelAnimationFrame(reset);
      window.clearInterval(id);
    };
  }, [text, active, speedMs]);

  return (
    <p
      className={cn("mt-2.5", className)}
      style={{
        fontSize: 14,
        lineHeight: 1.5,
        color: "var(--ink-2)",
        minHeight: 60,
      }}
    >
      {text.slice(0, n)}
      {active && n < text.length ? (
        <span
          aria-hidden
          style={{ color: "var(--accent)", marginLeft: 1 }}
        >
          ▍
        </span>
      ) : null}
    </p>
  );
}
