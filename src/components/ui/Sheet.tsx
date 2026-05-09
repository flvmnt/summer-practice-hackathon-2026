"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
};

/**
 * Bottom sheet that slides up from below.
 * Used by Map's venue card. Backdrop blur + slide animation.
 */
export function Sheet({ open, onOpenChange, children, className, ariaLabel }: Props) {
  const [mounted, setMounted] = useState(open);
  const [show, setShow] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => {
        setMounted(true);
        setShow(true);
      });
      return () => cancelAnimationFrame(id);
    }
    const hideId = requestAnimationFrame(() => setShow(false));
    const unmountId = window.setTimeout(() => setMounted(false), 260);
    return () => {
      cancelAnimationFrame(hideId);
      window.clearTimeout(unmountId);
    };
  }, [open]);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!mounted) return null;

  return (
    <div
      aria-hidden={!open}
      className="fixed inset-0 z-50"
      style={{ pointerEvents: open ? "auto" : "none" }}
    >
      <button
        type="button"
        aria-label="Close sheet"
        onClick={close}
        className="absolute inset-0 cursor-default border-0 transition-opacity"
        style={{
          background: "rgba(14, 26, 31, 0.32)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          opacity: show ? 1 : 0,
          transition: "opacity var(--t-3) var(--ease)",
        }}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={cn("absolute right-0 bottom-0 left-0", className)}
        style={{
          background: "var(--surface)",
          borderTopLeftRadius: "var(--r-shell)",
          borderTopRightRadius: "var(--r-shell)",
          boxShadow: "var(--shadow-3)",
          borderTop: "1px solid var(--line)",
          transform: show ? "translateY(0)" : "translateY(100%)",
          transition: "transform var(--t-3) var(--ease)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div
          aria-hidden
          style={{
            width: 38,
            height: 4,
            borderRadius: 2,
            background: "var(--line-2)",
            margin: "10px auto 8px",
          }}
        />
        {children}
      </div>
    </div>
  );
}
