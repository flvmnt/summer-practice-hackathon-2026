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
  groupHeadline?: string;
  memberCountLabel?: string | null;
  captainLine?: string | null;
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
  badminton: "badminton",
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
 * State C - matched into a group.
 *
 * UI/UX polish: tighter visual hierarchy. Header pill + mono member
 * count, then a sport glyph paired with a display headline + sport
 * pill, and a field-tone captain mention chip. Card radii now use
 * design-system tokens (no 12px). Confirm/Decline behaviour lives in
 * the dedicated decision card; the local button keeps its label only.
 */
export function TodayFoundCard({
  groupId,
  sport,
  sportLabel,
  captainName,
  groupSize,
  locale,
  inLabel,
  groupHeadline,
  memberCountLabel,
  captainLine,
  openLabel,
  confirmLabel,
  whyLabel,
  venueName,
  venueSub,
  matchScore = 92,
}: Props) {
  const SportIcon = Glyph[SPORT_GLYPH[sport] ?? "football"];
  const sizeText =
    memberCountLabel ??
    (groupSize ? `${groupSize.current}/${groupSize.ideal}` : null);
  const headline = groupHeadline ?? sportLabel;
  const resolvedCaptainLine =
    captainLine ?? (captainName ? `${captainName} is captain tonight` : null);

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
      <div className="flex items-center justify-between gap-2">
        <Pill variant="field" icon={<Glyph.check size={12} />}>
          <span style={{ fontWeight: 700 }}>{inLabel}</span>
        </Pill>
        {sizeText ? (
          <span
            className="mono"
            style={{
              fontSize: 12,
              color: "var(--ink-muted)",
              fontWeight: 600,
            }}
          >
            {sizeText}
          </span>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginTop: 18,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "var(--r-card)",
            background: "var(--accent-soft)",
            color: "var(--accent-deep)",
            display: "grid",
            placeItems: "center",
            flex: "none",
          }}
        >
          <SportIcon size={26} />
        </div>
        <div className="min-w-0 flex-1">
          <h2
            className="display truncate"
            style={{
              fontSize: 26,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            {headline}
          </h2>
          <div
            className="mt-1 flex flex-wrap items-center gap-2"
            style={{ fontSize: 13, color: "var(--ink-muted)" }}
          >
            <Pill variant="alt">
              <span style={{ fontWeight: 600 }}>{sportLabel}</span>
            </Pill>
          </div>
        </div>
      </div>

      {resolvedCaptainLine ? (
        <div
          className="mt-3 flex items-center gap-2"
          style={{
            background: "var(--field-soft)",
            borderRadius: "var(--r-chip)",
            padding: "6px 10px",
            width: "fit-content",
            maxWidth: "100%",
          }}
        >
          <span
            style={{
              display: "grid",
              placeItems: "center",
              width: 22,
              height: 22,
              borderRadius: 999,
              background: "var(--field)",
              color: "var(--field-ink)",
              flex: "none",
            }}
          >
            <Glyph.crown size={12} />
          </span>
          <span
            className="truncate"
            style={{
              fontSize: 12,
              color: "var(--field)",
              fontWeight: 600,
            }}
          >
            {resolvedCaptainLine}
          </span>
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
          {openLabel}
        </Link>
        <button
          type="button"
          className="inline-flex items-center justify-center font-semibold"
          style={{
            background: "transparent",
            color: "var(--ink-2)",
            minHeight: 48,
            borderRadius: "var(--r-pill)",
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
