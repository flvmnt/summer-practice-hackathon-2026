import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  sub?: string;
  weather?: ReactNode;
  primary?: boolean;
  warn?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

/**
 * VenueRow - used in CaptainAutoEventReveal sheet.
 * `primary` highlights the recommended row; `warn` marks weather caution.
 */
export function VenueRow({
  name,
  sub,
  weather,
  primary,
  warn,
  actionLabel,
  onAction,
  className,
}: Props) {
  return (
    <div
      className={cn("flex items-center gap-3 px-3.5 py-3", className)}
      style={{
        background: primary ? "var(--accent-tint)" : "var(--surface-2)",
        borderRadius: 14,
        border: primary
          ? "1px solid color-mix(in oklch, var(--accent) 25%, transparent)"
          : "1px solid transparent",
      }}
    >
      <div
        className="grid place-items-center"
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: primary ? "var(--accent)" : "var(--surface)",
          color: primary
            ? "var(--on-accent)"
            : warn
              ? "var(--warn-token)"
              : "var(--ink-muted)",
          boxShadow: primary ? "none" : "inset 0 0 0 1px var(--line)",
          flex: "none",
        }}
      >
        {weather}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className="truncate text-[13px] font-semibold"
          style={{ lineHeight: 1.2, color: "var(--ink)" }}
        >
          {name}
        </div>
        {sub ? (
          <div
            className="truncate text-[11px]"
            style={{ color: "var(--ink-muted)", marginTop: 2 }}
          >
            {sub}
          </div>
        ) : null}
      </div>
      {actionLabel ? (
        <button
          type="button"
          onClick={onAction}
          className="cursor-pointer rounded-full border-0 px-2.5 py-1.5 text-[11px] font-semibold"
          style={{
            background: primary ? "var(--ink)" : "transparent",
            color: primary ? "var(--bg)" : "var(--ink-muted)",
            boxShadow: primary ? "none" : "inset 0 0 0 1px var(--line-2)",
            minHeight: 28,
          }}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
