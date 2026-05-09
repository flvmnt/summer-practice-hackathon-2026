"use client";

import Link from "next/link";
import { VenueRow } from "@/components/event/VenueRow";
import { Glyph } from "@/components/ui/Glyph";
import { Pill } from "@/components/ui/Pill";

type Props = {
  groupId: string;
  locale: string;
  /** Display label like "Confirmed for tonight". */
  confirmedLabel?: string;
  /** Pre-formatted starts-at label, e.g. "Starts 18:30". Locale-formatted upstream. */
  startsLabel: string;
  /** Display headline, e.g. "Football · 18:30". Locale-formatted upstream. */
  whenLabel: string;
  /** Optional roster line, e.g. "8 going · 2 maybe". */
  rosterLabel?: string | null;
  venueName: string;
  venueSub: string;
  chatLabel: string;
  calendarLabel: string;
  calendarPendingLabel?: string;
  icsHref?: string;
};

/**
 * State F - group exists + event confirmed.
 *
 * UI/UX polish: per design spec §7.6, a thin --field-soft band sits along
 * the top edge of the card to reinforce "this is real, you are committed".
 * The card now reads as clearly post-decision (confirmed pill + roster
 * line + sport/time display headline) and transitions smoothly into the
 * group entry CTA. Time/date strings come pre-formatted from the parent
 * so we stay locale-aware via Intl upstream.
 */
export function TodayConfirmedCard({
  groupId,
  locale,
  confirmedLabel = "Confirmed for tonight",
  startsLabel,
  whenLabel,
  rosterLabel,
  venueName,
  venueSub,
  chatLabel,
  calendarLabel,
  calendarPendingLabel,
  icsHref,
}: Props) {
  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: "var(--r-surface)",
        boxShadow: "var(--shadow-3)",
        border: "1px solid var(--line)",
        overflow: "hidden",
      }}
    >
      {/* Field-soft band along the top: spec §7.6 */}
      <div
        aria-hidden
        style={{
          height: 6,
          background:
            "linear-gradient(90deg, var(--field) 0%, var(--field-soft) 100%)",
        }}
      />

      <div style={{ padding: "22px 22px 24px" }}>
        <div className="flex items-center justify-between gap-2">
          <Pill variant="field" icon={<Glyph.check size={12} />}>
            <span style={{ fontWeight: 700 }}>{confirmedLabel}</span>
          </Pill>
          <span
            className="mono"
            style={{ fontSize: 11, color: "var(--ink-muted)" }}
          >
            {startsLabel}
          </span>
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
          {whenLabel}
        </h2>

        {rosterLabel ? (
          <div
            className="mt-2 flex items-center gap-2"
            style={{ fontSize: 13, color: "var(--ink-muted)" }}
          >
            <Glyph.groups size={14} />
            <span>{rosterLabel}</span>
          </div>
        ) : null}

        <div style={{ marginTop: 14 }}>
          <VenueRow
            name={venueName}
            sub={venueSub}
            weather={<Glyph.pin size={18} />}
            primary
          />
        </div>

        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: "1fr 1fr", marginTop: 14 }}
        >
          <Link
            href={`/${locale}/groups/${groupId}`}
            className="inline-flex items-center justify-center gap-2 font-semibold"
            style={{
              background: "var(--accent)",
              color: "var(--on-accent)",
              minHeight: 48,
              borderRadius: "var(--r-pill)",
              padding: "0 16px",
              fontSize: 14,
            }}
          >
            <Glyph.chat size={16} />
            {chatLabel}
          </Link>
          {icsHref ? (
            <a
              href={icsHref}
              className="inline-flex items-center justify-center gap-2 font-semibold"
              style={{
                background: "var(--field-soft)",
                color: "var(--field)",
                minHeight: 48,
                borderRadius: "var(--r-pill)",
                padding: "0 16px",
                fontSize: 14,
              }}
              download
            >
              <Glyph.cal size={16} />
              {calendarLabel}
            </a>
          ) : (
            <button
              type="button"
              disabled
              aria-label={calendarPendingLabel ?? calendarLabel}
              title={calendarPendingLabel ?? calendarLabel}
              className="inline-flex items-center justify-center gap-2 font-semibold"
              style={{
                background: "var(--surface-2)",
                color: "var(--ink-muted)",
                minHeight: 48,
                borderRadius: "var(--r-pill)",
                border: "1px solid var(--line)",
                padding: "0 16px",
                fontSize: 14,
                cursor: "not-allowed",
              }}
            >
              <Glyph.cal size={16} />
              {calendarLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
