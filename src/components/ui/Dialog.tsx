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
  ariaLabelledBy?: string;
  /**
   * aria-label for the backdrop close button. Pass a localized string
   * (e.g. `t("ui.dialog.close")`); falls back to English if omitted.
   */
  closeLabel?: string;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Centered modal dialog with focus trap, ESC + backdrop close.
 */
export function Dialog({
  open,
  onOpenChange,
  children,
  className,
  ariaLabel,
  ariaLabelledBy,
  closeLabel,
}: Props) {
  const [mounted, setMounted] = useState(open);
  const [show, setShow] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const lastActiveRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      lastActiveRef.current = document.activeElement as HTMLElement | null;
      const id = requestAnimationFrame(() => {
        setMounted(true);
        setShow(true);
      });
      return () => cancelAnimationFrame(id);
    }
    const hideId = requestAnimationFrame(() => setShow(false));
    const unmountId = window.setTimeout(() => setMounted(false), 200);
    return () => {
      cancelAnimationFrame(hideId);
      window.clearTimeout(unmountId);
    };
  }, [open]);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  // focus trap + ESC
  useEffect(() => {
    if (!open || !panelRef.current) return;
    const node = panelRef.current;
    const focusables = node.querySelectorAll<HTMLElement>(FOCUSABLE);
    focusables[0]?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      lastActiveRef.current?.focus?.();
    };
  }, [open, close]);

  if (!mounted) return null;

  return (
    <div
      aria-hidden={!open}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ pointerEvents: open ? "auto" : "none" }}
    >
      <button
        type="button"
        aria-label={closeLabel ?? "Close dialog"}
        onClick={close}
        className="absolute inset-0 cursor-default border-0"
        style={{
          background: "rgba(14, 26, 31, 0.42)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          opacity: show ? 1 : 0,
          transition: "opacity var(--t-2) var(--ease)",
        }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabelledBy ? undefined : ariaLabel}
        aria-labelledby={ariaLabelledBy}
        className={cn("relative w-full max-w-md", className)}
        style={{
          background: "var(--surface)",
          borderRadius: "var(--r-surface)",
          boxShadow: "var(--shadow-3)",
          border: "1px solid var(--line)",
          padding: 22,
          transform: show ? "translateY(0) scale(1)" : "translateY(8px) scale(0.98)",
          opacity: show ? 1 : 0,
          transition:
            "transform var(--t-2) var(--ease), opacity var(--t-2) var(--ease)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
