"use client";

import { ArrowUpRight, MapPin } from "lucide-react";
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
    /** Optional translated labels for the directions provider links. */
    directionsGoogle?: string;
    directionsApple?: string;
    directionsWaze?: string;
  };
};

// TODO: wire these to next-intl keys
//   map.venueSheet.directions      EN: "Directions"          RO: "Direcții"
//   map.venueSheet.directionsGoogle EN: "Google Maps"        RO: "Google Maps"
//   map.venueSheet.directionsApple  EN: "Apple Maps"         RO: "Apple Maps"
//   map.venueSheet.directionsWaze   EN: "Waze"               RO: "Waze"
const DIRECTIONS_FALLBACK = {
  google: "Google Maps",
  apple: "Apple Maps",
  waze: "Waze",
} as const;

const PRICE_LABEL: Record<0 | 1 | 2, "priceFree" | "priceLow" | "priceMedium"> = {
  0: "priceFree",
  1: "priceLow",
  2: "priceMedium",
};

function googleHref(venue: MapVenue) {
  const q = encodeURIComponent(`${venue.lat},${venue.lon}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${q}`;
}

function appleHref(venue: MapVenue) {
  const q = encodeURIComponent(`${venue.lat},${venue.lon}`);
  return `https://maps.apple.com/?daddr=${q}`;
}

function wazeHref(venue: MapVenue) {
  return `https://www.waze.com/ul?ll=${venue.lat},${venue.lon}&navigate=yes`;
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
              <div className="mt-4 grid gap-3">
                <section aria-labelledby="venue-directions-heading">
                  <h3
                    id="venue-directions-heading"
                    className="mb-2 inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    <MapPin size={14} aria-hidden />
                    {labels.directions}
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <a
                      href={googleHref(venue)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${labels.directions}: ${labels.directionsGoogle ?? DIRECTIONS_FALLBACK.google} (${venue.name})`}
                      className="btn-s2m btn-secondary inline-flex items-center justify-center gap-1 px-2 text-[12px]"
                      style={{ minHeight: 44 }}
                    >
                      <span className="truncate">
                        {labels.directionsGoogle ?? DIRECTIONS_FALLBACK.google}
                      </span>
                      <ArrowUpRight size={12} aria-hidden />
                    </a>
                    <a
                      href={appleHref(venue)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${labels.directions}: ${labels.directionsApple ?? DIRECTIONS_FALLBACK.apple} (${venue.name})`}
                      className="btn-s2m btn-secondary inline-flex items-center justify-center gap-1 px-2 text-[12px]"
                      style={{ minHeight: 44 }}
                    >
                      <span className="truncate">
                        {labels.directionsApple ?? DIRECTIONS_FALLBACK.apple}
                      </span>
                      <ArrowUpRight size={12} aria-hidden />
                    </a>
                    <a
                      href={wazeHref(venue)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${labels.directions}: ${labels.directionsWaze ?? DIRECTIONS_FALLBACK.waze} (${venue.name})`}
                      className="btn-s2m btn-secondary inline-flex items-center justify-center gap-1 px-2 text-[12px]"
                      style={{ minHeight: 44 }}
                    >
                      <span className="truncate">
                        {labels.directionsWaze ?? DIRECTIONS_FALLBACK.waze}
                      </span>
                      <ArrowUpRight size={12} aria-hidden />
                    </a>
                  </div>
                </section>
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
