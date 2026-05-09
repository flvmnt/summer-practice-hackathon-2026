"use client";

import { Glyph } from "@/components/ui/Glyph";

type Props = {
  title: string;
  body: string;
  changeLabel: string;
  onChange?: () => void;
};

/**
 * State E - user clicked Not today.
 * Smaller card; offers a Change-to-Yes affordance.
 */
export function TodaySaidNoCard({ title, body, changeLabel, onChange }: Props) {
  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: "var(--r-surface)",
        padding: "22px 22px 20px",
        boxShadow: "var(--shadow-2)",
        border: "1px solid var(--line)",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 999,
            background: "var(--surface-2)",
            display: "grid",
            placeItems: "center",
            color: "var(--ink-muted)",
            flex: "none",
          }}
        >
          <Glyph.close size={18} />
        </div>
        <div
          className="display"
          style={{ fontSize: 24, lineHeight: 1.1 }}
        >
          {title}
        </div>
      </div>
      <p
        style={{
          fontSize: 14,
          color: "var(--ink-muted)",
          marginTop: 10,
          lineHeight: 1.45,
        }}
      >
        {body}
      </p>
      <button
        type="button"
        onClick={onChange}
        className="mt-4 inline-flex items-center gap-2 font-semibold"
        style={{
          background: "transparent",
          color: "var(--accent-deep)",
          border: "none",
          padding: 0,
          cursor: "pointer",
          fontSize: 14,
        }}
      >
        {changeLabel}
      </button>
    </div>
  );
}
