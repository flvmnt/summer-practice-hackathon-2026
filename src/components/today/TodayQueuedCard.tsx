"use client";

import Link from "next/link";
import { Glyph } from "@/components/ui/Glyph";
import { Pill } from "@/components/ui/Pill";
import type { SportKey } from "@/lib/sports";

type Props = {
  sportLabel: string;
  bodyText: string;
  elapsedLabel: string;
  planBLabel: string;
  planBLinks: ReadonlyArray<{ label: string; href: string }>;
  primarySport?: SportKey;
};

/**
 * State D — Yes clicked, but no match yet (queued).
 */
export function TodayQueuedCard({
  sportLabel,
  bodyText,
  elapsedLabel,
  planBLabel,
  planBLinks,
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
      <div className="flex items-center gap-3">
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 999,
            background: "var(--accent-soft)",
            display: "grid",
            placeItems: "center",
            color: "var(--accent-deep)",
            flex: "none",
          }}
        >
          <Glyph.clock size={18} />
        </div>
        <Pill variant="alt">
          <span style={{ fontWeight: 700 }}>Looking for {sportLabel}</span>
        </Pill>
      </div>

      <div
        className="display"
        style={{ fontSize: 28, marginTop: 18, lineHeight: 1.1 }}
      >
        You&rsquo;re in the queue
      </div>
      <p
        style={{
          fontSize: 14,
          color: "var(--ink-muted)",
          marginTop: 10,
          lineHeight: 1.45,
        }}
      >
        {bodyText}
      </p>

      <div
        style={{
          marginTop: 18,
          padding: "14px 16px",
          background: "var(--surface-2)",
          borderRadius: 14,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>
            Searching
          </div>
          <div
            className="mono"
            style={{ fontSize: 22, fontWeight: 700, marginTop: 2 }}
          >
            {elapsedLabel}
          </div>
        </div>
        <Pill variant="live">
          <span style={{ fontWeight: 700 }}>LIVE</span>
        </Pill>
      </div>

      <div
        style={{
          marginTop: 16,
          padding: 14,
          background: "var(--accent-tint)",
          borderRadius: 14,
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
        <div className="mt-2 flex flex-col gap-2">
          {planBLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-[13px] font-semibold"
              style={{
                background: "var(--surface)",
                color: "var(--ink)",
                border: "1px solid var(--line)",
                minHeight: 40,
              }}
            >
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
