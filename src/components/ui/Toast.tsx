"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "success" | "alert";

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastItem = ToastInput & {
  id: string;
  variant: ToastVariant;
  durationMs: number;
};

type ToastContextValue = {
  push: (toast: ToastInput) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `t-${Math.random().toString(36).slice(2, 10)}`;
}

export function ToastProvider({
  children,
  dismissLabel,
}: {
  children: ReactNode;
  /**
   * aria-label for the per-toast dismiss button. Pass a localized string
   * (e.g. `t("ui.toast.dismiss")`); falls back to English if omitted.
   */
  dismissLabel?: string;
}) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (input: ToastInput) => {
      const id = makeId();
      const duration = input.durationMs ?? 4000;
      const item: ToastItem = {
        id,
        title: input.title,
        description: input.description,
        variant: input.variant ?? "default",
        durationMs: duration,
      };
      setItems((prev) => [...prev, item]);
      const t = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, t);
      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    const map = timers.current;
    return () => {
      for (const t of map.values()) clearTimeout(t);
      map.clear();
    };
  }, []);

  const value = useMemo(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport items={items} onDismiss={dismiss} dismissLabel={dismissLabel} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within <ToastProvider>");
  }
  return ctx;
}

type ViewportProps = {
  items: ToastItem[];
  onDismiss: (id: string) => void;
  dismissLabel?: string;
};

export function ToastViewport({ items, onDismiss, dismissLabel }: ViewportProps) {
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed top-3 right-3 left-3 z-[60] flex flex-col gap-2 sm:left-auto sm:max-w-sm"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {items.map((item) => (
        <div
          key={item.id}
          role="status"
          className={cn(
            "pointer-events-auto flex items-start gap-3 px-4 py-3",
          )}
          style={{
            background: "var(--surface)",
            color: "var(--ink)",
            borderRadius: "var(--r-card)",
            boxShadow: "var(--shadow-3)",
            border: "1px solid var(--line)",
            borderLeftWidth: 4,
            borderLeftStyle: "solid",
            borderLeftColor:
              item.variant === "alert"
                ? "var(--alert)"
                : item.variant === "success"
                  ? "var(--field)"
                  : "var(--accent)",
          }}
        >
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold leading-tight">{item.title}</div>
            {item.description ? (
              <div
                className="mt-1 text-[12px] leading-snug"
                style={{ color: "var(--ink-muted)" }}
              >
                {item.description}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => onDismiss(item.id)}
            aria-label={dismissLabel ?? "Dismiss notification"}
            className="-mr-1 -mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full border-0 bg-transparent text-[var(--ink-muted)] hover:bg-[var(--surface-2)]"
          >
            <span aria-hidden>×</span>
          </button>
        </div>
      ))}
    </div>
  );
}
