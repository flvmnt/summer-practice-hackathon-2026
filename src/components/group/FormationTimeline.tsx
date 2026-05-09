"use client";

import { useId, useState, type ReactNode } from "react";
import { Glyph } from "@/components/ui/Glyph";
import { AIMark } from "@/components/ui/AIMark";
import { cn } from "@/lib/utils";

export type FormationReason = {
  icon?: ReactNode;
  label: string;
  value?: string;
};

type Props = {
  reasons: ReadonlyArray<FormationReason>;
  score?: number;
  defaultOpen?: boolean;
  title?: string;
  className?: string;
};

/**
 * "Why this group?" expandable panel.
 * Distance gate, shared sport, skill mix, group-size fit, AI explanation.
 */
export function FormationTimeline({
  reasons,
  score,
  defaultOpen = false,
  title = "Why this group?",
  className,
}: Props) {
  const id = useId();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className={cn("w-full", className)}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-card)",
        padding: 12,
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 border-0 bg-transparent text-left"
        style={{ color: "var(--ink-muted)", fontSize: 13, minHeight: 36 }}
      >
        <AIMark className="text-[var(--accent)]" />
        <span className="flex-1" style={{ fontWeight: 600 }}>
          {title}
        </span>
        {typeof score === "number" ? (
          <span className="mono" style={{ color: "var(--ink)" }}>
            {score}
          </span>
        ) : null}
        <span
          aria-hidden
          style={{
            display: "inline-flex",
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform var(--t-2) var(--ease)",
          }}
        >
          <Glyph.chevron size={14} />
        </span>
      </button>
      {open ? (
        <ul
          id={`${id}-panel`}
          className="mt-3 flex flex-col gap-1.5"
          style={{
            background: "var(--accent-tint)",
            borderRadius: 12,
            padding: 12,
          }}
        >
          {reasons.map((r, i) => (
            <li
              key={i}
              className="flex items-center gap-2 text-[12px]"
              style={{ padding: "4px 0", color: "var(--ink-2)" }}
            >
              <span
                className="grid place-items-center"
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 6,
                  background: "var(--surface)",
                  color: "var(--accent-deep)",
                  flex: "none",
                }}
              >
                {r.icon ?? <Glyph.check size={12} />}
              </span>
              <span className="flex-1">{r.label}</span>
              {r.value ? (
                <span className="mono" style={{ color: "var(--ink-muted)" }}>
                  {r.value}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
