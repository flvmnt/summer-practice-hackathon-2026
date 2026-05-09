"use client";

import Link from "next/link";
import { Glyph } from "@/components/ui/Glyph";
import { Pill } from "@/components/ui/Pill";
import type { SportKey } from "@/lib/sports";

type ProgressStep = {
  label: string;
  /** "active" pulses; "done" is filled; "wait" is faint. */
  state: "done" | "active" | "wait";
};

type Props = {
  title: string;
  subhead: string;
  lookingForLabel: string;
  elapsedLabel: string;
  searchingLabel: string;
  planBLabel: string;
  planBHint: string;
  planBLinks: ReadonlyArray<{ label: string; href: string }>;
  progress?: ReadonlyArray<ProgressStep>;
  primarySport?: SportKey;
};

const DEFAULT_PROGRESS: ReadonlyArray<ProgressStep> = [
  { label: "Scanning nearby players", state: "done" },
  { label: "Matching skill levels", state: "active" },
  { label: "Finalizing your crew", state: "wait" },
];

/**
 * State D - Yes clicked, but no match yet (queued).
 *
 * UI/UX polish: bare clock spinner replaced with a 3-step progress
 * column ("we're looking for your group") so the wait reads like the
 * system is actively working. Stable card dimensions match State B
 * (searching) so the frame doesn't jump.
 */
export function TodayQueuedCard({
  title,
  subhead,
  lookingForLabel,
  elapsedLabel,
  searchingLabel,
  planBLabel,
  planBHint,
  planBLinks,
  progress = DEFAULT_PROGRESS,
}: Props) {
  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: "var(--r-surface)",
        padding: "26px 24px",
        boxShadow: "var(--shadow-3)",
        border: "1px solid var(--line)",
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Pill variant="live">
          <span style={{ fontWeight: 700 }}>{searchingLabel}</span>
        </Pill>
        <Pill variant="alt" icon={<Glyph.search size={12} />}>
          <span style={{ fontWeight: 700 }}>{lookingForLabel}</span>
        </Pill>
      </div>

      <h2
        className="display"
        style={{
          fontSize: 28,
          marginTop: 18,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontSize: 14,
          color: "var(--ink-muted)",
          marginTop: 10,
          lineHeight: 1.45,
          maxWidth: 360,
        }}
      >
        {subhead}
      </p>

      <ol
        aria-live="polite"
        style={{
          marginTop: 18,
          padding: "16px 18px",
          background: "var(--surface-2)",
          borderRadius: "var(--r-card)",
          listStyle: "none",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {progress.map((step, index) => (
          <li
            key={index}
            className="flex items-center gap-3"
            style={{ minHeight: 28 }}
          >
            <span
              aria-hidden
              className={step.state === "active" ? "queued-pulse" : undefined}
              style={{
                width: 18,
                height: 18,
                borderRadius: 999,
                flex: "none",
                background:
                  step.state === "done"
                    ? "var(--field)"
                    : step.state === "active"
                      ? "var(--accent)"
                      : "var(--line-2)",
                color: "var(--field-ink)",
                display: "grid",
                placeItems: "center",
                boxShadow:
                  step.state === "active"
                    ? "0 0 0 4px color-mix(in oklch, var(--accent) 20%, transparent)"
                    : "none",
              }}
            >
              {step.state === "done" ? <Glyph.check size={12} /> : null}
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: step.state === "active" ? 600 : 500,
                color:
                  step.state === "wait" ? "var(--ink-muted)" : "var(--ink)",
              }}
            >
              {step.label}
            </span>
            {step.state === "active" ? (
              <span
                className="mono"
                style={{
                  marginLeft: "auto",
                  fontSize: 11,
                  color: "var(--ink-muted)",
                }}
              >
                {elapsedLabel}
              </span>
            ) : null}
          </li>
        ))}
      </ol>

      <div
        style={{
          marginTop: 16,
          padding: 14,
          background: "var(--accent-tint)",
          borderRadius: "var(--r-card)",
        }}
      >
        <div
          className="mono"
          style={{
            fontSize: 11,
            color: "var(--accent-deep)",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            fontWeight: 700,
          }}
        >
          {planBLabel}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--ink-muted)",
            marginTop: 4,
            lineHeight: 1.4,
          }}
        >
          {planBHint}
        </div>
        <div className="mt-2 flex flex-col gap-2">
          {planBLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center justify-between px-3 py-2 text-[13px] font-semibold"
              style={{
                background: "var(--surface)",
                color: "var(--ink)",
                border: "1px solid var(--line)",
                borderRadius: "var(--r-chip)",
                minHeight: 44,
              }}
            >
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <style jsx>{`
        .queued-pulse {
          animation: queued-pulse 1.6s ease-in-out infinite;
        }
        @keyframes queued-pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.08);
            opacity: 0.85;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .queued-pulse {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
