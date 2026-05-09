"use client";

import { Glyph } from "@/components/ui/Glyph";

type Props = {
  title: string;
  body: string;
  changeLabel: string;
  /** Optional secondary hint linking to public events. */
  browseHint?: string;
  onChange?: () => void;
};

/**
 * State E - user clicked Not today.
 *
 * UI/UX polish: matches the empty/error visual rhythm of the other Today
 * states - same surface radius, same icon-pill+title pairing, restful
 * subhead, and an unambiguous "Change to Yes" affordance with arrow
 * glyph for forward motion. Stable dimensions match State A so the card
 * doesn't collapse when the user toggles.
 */
export function TodaySaidNoCard({
  title,
  body,
  changeLabel,
  browseHint,
  onChange,
}: Props) {
  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: "var(--r-surface)",
        padding: "22px 22px 22px",
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
        <h2
          className="display"
          style={{
            fontSize: 24,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h2>
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
          minHeight: 44,
        }}
      >
        {changeLabel}
        <Glyph.arrow size={14} />
      </button>
      {browseHint ? (
        <p
          className="mt-3"
          style={{
            fontSize: 12,
            color: "var(--ink-muted)",
            lineHeight: 1.4,
          }}
        >
          {browseHint}
        </p>
      ) : null}
    </div>
  );
}
