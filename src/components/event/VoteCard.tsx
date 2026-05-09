"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type VoteOption = {
  id: string;
  label: string;
  votes: number;
};

type Props = {
  options: ReadonlyArray<VoteOption>;
  total: number;
  myVote?: string | null;
  onVote?: (optionId: string) => void;
  canClose?: boolean;
  onClose?: () => void;
  closingInSeconds?: number; // for countdown display
  title?: string;
  className?: string;
  disabled?: boolean;
};

/**
 * Animated vote card. Bar widths spring in on mount and update.
 * Mono "X/Y voted" counter and optional countdown.
 */
export function VoteCard({
  options,
  total,
  myVote,
  onVote,
  canClose,
  onClose,
  closingInSeconds,
  title = "Venue vote",
  className,
  disabled,
}: Props) {
  const t = useTranslations();
  const [animated, setAnimated] = useState(false);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      const id = requestAnimationFrame(() => setAnimated(true));
      return () => cancelAnimationFrame(id);
    }
  }, []);

  const totalVotes = useMemo(
    () => options.reduce((sum, o) => sum + o.votes, 0),
    [options],
  );
  const leadingId = useMemo(() => {
    if (options.length === 0) return null;
    return options.reduce((a, b) => (a.votes >= b.votes ? a : b)).id;
  }, [options]);

  const countdown = formatCountdown(closingInSeconds);

  return (
    <div
      role="group"
      aria-label={title}
      className={cn("w-full", className)}
      style={{
        padding: 14,
        background: "var(--surface)",
        borderRadius: 16,
        border: "1px solid var(--line)",
        boxShadow: "var(--shadow-1)",
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="text-[12px] font-bold uppercase tracking-[0.06em]"
          style={{ color: "var(--ink-muted)" }}
        >
          {title}
        </div>
        <div
          className="mono text-[11px]"
          style={{ color: "var(--ink-muted)" }}
        >
          {total} / {Math.max(total, totalVotes)} voted
          {countdown ? ` · ${countdown}` : ""}
        </div>
      </div>
      <ul
        className="mt-2.5 grid gap-2"
        aria-live="polite"
        aria-atomic="true"
      >
        {options.map((o, i) => {
          const pct = totalVotes > 0 ? (o.votes / totalVotes) * 100 : 0;
          const isMine = myVote === o.id;
          const isLeading = leadingId === o.id;
          return (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => !disabled && onVote?.(o.id)}
                disabled={disabled}
                aria-pressed={isMine}
                className={cn(
                  "relative w-full overflow-hidden rounded-[10px] border-0 px-3 py-2.5 text-left",
                )}
                style={{
                  background: "var(--surface-2)",
                  cursor: disabled ? "default" : "pointer",
                  minHeight: 44,
                }}
              >
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0"
                  style={{
                    width: animated ? `${pct}%` : 0,
                    background: isLeading
                      ? "var(--accent-soft)"
                      : "var(--field-soft)",
                    transition: `width 600ms var(--ease-spring) ${i * 80}ms`,
                  }}
                />
                <span className="relative flex items-center justify-between text-[13px]">
                  <span
                    className="truncate"
                    style={{
                      fontWeight: isLeading ? 700 : 500,
                      color: "var(--ink)",
                    }}
                  >
                    {o.label}
                    {isMine ? (
                      <span
                        className="mono ml-2 text-[10px] font-bold uppercase tracking-[0.1em]"
                        style={{ color: "var(--accent-deep)" }}
                      >
                        {t("event.vote.yourVote")}
                      </span>
                    ) : null}
                  </span>
                  <span
                    className="mono"
                    style={{ fontWeight: 700, color: "var(--ink)" }}
                  >
                    {o.votes}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {canClose ? (
        <button
          type="button"
          onClick={onClose}
          className="btn-s2m btn-secondary mt-2.5"
          style={{
            width: "100%",
            padding: "10px 16px",
            minHeight: 40,
            fontSize: 13,
          }}
        >
          {t("event.vote.closeVote")}
        </button>
      ) : null}
    </div>
  );
}

function formatCountdown(seconds: number | undefined): string | null {
  if (seconds === undefined || seconds < 0) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
