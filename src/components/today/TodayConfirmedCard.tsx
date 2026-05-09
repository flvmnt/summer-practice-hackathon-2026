"use client";

import Link from "next/link";
import { VenueRow } from "@/components/event/VenueRow";
import { Glyph } from "@/components/ui/Glyph";
import { Pill } from "@/components/ui/Pill";

type Props = {
  groupId: string;
  locale: string;
  startsLabel: string;
  whenLabel: string;
  venueName: string;
  venueSub: string;
  chatLabel: string;
  calendarLabel: string;
  icsHref?: string;
};

/**
 * State F — group exists + event confirmed.
 */
export function TodayConfirmedCard({
  groupId,
  locale,
  startsLabel,
  whenLabel,
  venueName,
  venueSub,
  chatLabel,
  calendarLabel,
  icsHref,
}: Props) {
  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: "var(--r-surface)",
        padding: "22px 22px 24px",
        boxShadow: "var(--shadow-3)",
        border: "1px solid var(--line)",
      }}
    >
      <div className="flex items-center justify-between">
        <Pill variant="field" icon={<Glyph.check size={12} />}>
          <span style={{ fontWeight: 700 }}>Confirmed</span>
        </Pill>
        <span
          className="mono"
          style={{ fontSize: 11, color: "var(--ink-muted)" }}
        >
          {startsLabel}
        </span>
      </div>
      <div
        className="display"
        style={{ fontSize: 28, marginTop: 18, lineHeight: 1.1 }}
      >
        {whenLabel}
      </div>
      <div
        style={{ fontSize: 14, color: "var(--ink-muted)", marginTop: 6 }}
      >
        {venueSub}
      </div>

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
            borderRadius: 12,
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
              borderRadius: 12,
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
            className="inline-flex items-center justify-center gap-2 font-semibold"
            style={{
              background: "var(--surface-2)",
              color: "var(--ink-muted)",
              minHeight: 48,
              borderRadius: 12,
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
  );
}
