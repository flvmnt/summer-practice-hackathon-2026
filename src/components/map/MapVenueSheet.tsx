"use client";

import { Glyph } from "@/components/ui/Glyph";
import { Pill } from "@/components/ui/Pill";
import type { MapVenue } from "./seed-venues";
import type { SportKey } from "@/lib/sports";

type Props = {
  venue: MapVenue | null;
  expanded: boolean;
  onToggleExpanded: () => void;
  labels: {
    selectPrompt: string;
    directions: string;
    join: string;
    startGame: string;
    sport: Record<SportKey, string>;
    priceFree: string;
    priceLow: string;
    priceMedium: string;
  };
};

const PRICE_LABEL: Record<0 | 1 | 2, "priceFree" | "priceLow" | "priceMedium"> = {
  0: "priceFree",
  1: "priceLow",
  2: "priceMedium",
};

function directionsHref(venue: MapVenue) {
  const q = encodeURIComponent(`${venue.lat},${venue.lon}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${q}`;
}

/**
 * Bottom sheet for the mobile map. Two states:
 *  - collapsed (96px) showing a handle + venue summary
 *  - expanded (~60vh) with details + actions
 * Desktop layouts hide this; the sidebar shows the same data.
 */
export function MapVenueSheet({ venue, expanded, onToggleExpanded, labels }: Props) {
  return (
    <div
      role="region"
      aria-label="Venue details"
      className="fixed right-0 bottom-[78px] left-0 md:hidden"
      style={{
        background: "var(--surface)",
        borderTopLeftRadius: "var(--r-shell)",
        borderTopRightRadius: "var(--r-shell)",
        boxShadow: "var(--shadow-3)",
        borderTop: "1px solid var(--line)",
        height: expanded ? "60vh" : 96,
        transition: "height var(--t-3) var(--ease)",
        zIndex: 30,
        paddingBottom: "env(safe-area-inset-bottom)",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={onToggleExpanded}
        aria-expanded={expanded}
        aria-label={expanded ? "Collapse venue details" : "Expand venue details"}
        className="flex w-full cursor-pointer items-center gap-3 border-0 bg-transparent px-4 pt-2 pb-2 text-left"
      >
        <span
          aria-hidden
          style={{
            display: "block",
            width: 38,
            height: 4,
            borderRadius: 2,
            background: "var(--line-2)",
            margin: "0 auto",
            position: "absolute",
            top: 8,
            left: 0,
            right: 0,
          }}
        />
      </button>
      <div className="px-4 pt-5">
        {venue ? (
          <>
            <div className="flex items-start gap-3">
              <div
                className="grid place-items-center"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: venue.eventAt ? "var(--accent-soft)" : "var(--field-soft)",
                  color: venue.eventAt ? "var(--accent-deep)" : "var(--field)",
                  flex: "none",
                }}
              >
                <Glyph.pin size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className="display truncate"
                  style={{ fontSize: 18, lineHeight: 1.2, color: "var(--ink)" }}
                >
                  {venue.name}
                </div>
                <div
                  className="mono mt-1 truncate text-[11px]"
                  style={{ color: "var(--ink-muted)" }}
                >
                  {labels.sport[venue.sport]} · {venue.city}
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Pill variant="field">{labels.sport[venue.sport]}</Pill>
              <Pill variant="default">{labels[PRICE_LABEL[venue.priceTier]]}</Pill>
            </div>
            {expanded ? (
              <div className="mt-4 grid gap-2">
                <a
                  href={directionsHref(venue)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-s2m btn-secondary inline-flex items-center justify-center gap-2"
                  style={{ minHeight: 44 }}
                >
                  <Glyph.car size={16} />
                  {labels.directions}
                </a>
                <button
                  type="button"
                  className="btn-s2m inline-flex items-center justify-center gap-2"
                  style={{ minHeight: 44 }}
                >
                  <Glyph.plus size={16} />
                  {venue.eventAt ? labels.join : labels.startGame}
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <p
            className="mt-2 text-center text-[13px]"
            style={{ color: "var(--ink-muted)" }}
          >
            {labels.selectPrompt}
          </p>
        )}
      </div>
    </div>
  );
}
