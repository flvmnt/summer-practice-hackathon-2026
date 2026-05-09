"use client";

import Link from "next/link";
import { FormationTimeline, type FormationReason } from "@/components/group/FormationTimeline";
import { VenueRow } from "@/components/event/VenueRow";
import { Glyph, type GlyphName } from "@/components/ui/Glyph";
import { Pill } from "@/components/ui/Pill";
import type { SportKey } from "@/lib/sports";

type Props = {
  groupId: string;
  sport: SportKey;
  sportLabel: string;
  captainName?: string | null;
  groupSize?: { current: number; ideal: number } | null;
  locale: string;
  inLabel: string;
  openLabel: string;
  confirmLabel: string;
  whyLabel: string;
  venueName: string;
  venueSub: string;
  matchScore?: number;
};

const SPORT_GLYPH: Partial<Record<SportKey, GlyphName>> = {
  football: "football",
  basketball: "basketball",
  tennis: "tennis",
  volleyball: "volley",
  badminton: "tennis",
  running: "running",
  cycling: "running",
  yoga: "spark",
  hiking: "globe",
  table_tennis: "tennis",
};

const DEFAULT_REASONS: ReadonlyArray<FormationReason> = [
  { label: "Same sport preference", value: "100" },
  { label: "Skill level fits", value: "92" },
  { label: "Within your radius", value: "84" },
  { label: "Available in this window", value: "95" },
];

/**
 * State C — matched into a group.
 */
export function TodayFoundCard({
  groupId,
  sport,
  sportLabel,
  captainName,
  groupSize,
  locale,
  inLabel,
  openLabel,
  confirmLabel,
  whyLabel,
  venueName,
  venueSub,
  matchScore = 92,
}: Props) {
  const SportIcon = Glyph[SPORT_GLYPH[sport] ?? "football"];
  const sizeText = groupSize
    ? `${groupSize.current}/${groupSize.ideal}`
    : null;

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
          <span style={{ fontWeight: 700 }}>{inLabel}</span>
        </Pill>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: "var(--accent-soft)",
            color: "var(--accent-deep)",
            display: "grid",
            placeItems: "center",
            flex: "none",
          }}
        >
          <SportIcon size={24} />
        </div>
        <div className="min-w-0">
          <div
            className="display"
            style={{ fontSize: 24, lineHeight: 1.1 }}
          >
            {sportLabel}
            {sizeText ? (
              <span
                className="mono"
                style={{ marginLeft: 10, fontSize: 18, color: "var(--ink-muted)" }}
              >
                {sizeText}
              </span>
            ) : null}
          </div>
          {captainName ? (
            <div
              className="mt-1 truncate"
              style={{ fontSize: 13, color: "var(--ink-muted)" }}
            >
              <Glyph.crown size={14} className="inline-block" />{" "}
              <strong style={{ color: "var(--ink)" }}>{captainName}</strong> · captain
            </div>
          ) : null}
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <VenueRow
          name={venueName}
          sub={venueSub}
          weather={<Glyph.pin size={18} />}
          primary
        />
      </div>

      <div style={{ marginTop: 14 }}>
        <FormationTimeline
          reasons={DEFAULT_REASONS}
          score={matchScore}
          title={whyLabel}
        />
      </div>

      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: "1.4fr 1fr", marginTop: 16 }}
      >
        <Link
          href={`/${locale}/groups/${groupId}`}
          className="inline-flex items-center justify-center font-semibold"
          style={{
            background: "var(--accent)",
            color: "var(--on-accent)",
            minHeight: 48,
            borderRadius: 12,
            padding: "0 16px",
            fontSize: 14,
          }}
        >
          {openLabel}
        </Link>
        <button
          type="button"
          className="inline-flex items-center justify-center font-semibold"
          style={{
            background: "transparent",
            color: "var(--ink-2)",
            minHeight: 48,
            borderRadius: 12,
            border: "1px solid var(--line)",
            padding: "0 16px",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
