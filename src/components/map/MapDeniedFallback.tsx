"use client";

import { Card } from "@/components/ui/Card";
import { Glyph } from "@/components/ui/Glyph";
import { Pill } from "@/components/ui/Pill";
import type { MapVenue } from "./seed-venues";
import type { SportKey } from "@/lib/sports";

type Props = {
  venues: ReadonlyArray<MapVenue>;
  onRetry: () => void;
  labels: {
    title: string;
    body: string;
    useMyLocation: string;
    listHeader: string;
    fallbackHint: string;
    privacyNotice: string;
    directions: string;
    distanceUnknown: string;
    sport: Record<SportKey, string>;
  };
};

function directionsHref(venue: MapVenue) {
  const q = encodeURIComponent(`${venue.lat},${venue.lon}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${q}`;
}

/**
 * Rendered when geolocation is denied or `MapView` cannot initialise.
 * Lists venues by city with directions links + a retry button.
 * The privacy notice is part of the trust contract per spec §10.2.1.
 */
export function MapDeniedFallback({ venues, onRetry, labels }: Props) {
  return (
    <div className="flex w-full flex-col gap-4">
      <Card variant="card" className="p-5">
        <div className="flex items-start gap-3">
          <div
            className="grid place-items-center"
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              background: "var(--accent-soft)",
              color: "var(--accent-deep)",
              flex: "none",
            }}
          >
            <Glyph.shield size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <div
              className="display"
              style={{ fontSize: 20, lineHeight: 1.2, color: "var(--ink)" }}
            >
              {labels.title}
            </div>
            <p
              className="mt-1 text-[13px]"
              style={{ color: "var(--ink-muted)", lineHeight: 1.5 }}
            >
              {labels.body}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="btn-s2m mt-4 inline-flex items-center justify-center gap-2"
          style={{ minHeight: 44, padding: "12px 18px", fontSize: 14 }}
        >
          <Glyph.pin size={16} />
          {labels.useMyLocation}
        </button>
      </Card>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2
            className="display"
            style={{ fontSize: 18, color: "var(--ink)" }}
          >
            {labels.listHeader}
          </h2>
          <span
            className="mono text-[11px]"
            style={{ color: "var(--ink-muted)" }}
          >
            {labels.fallbackHint}
          </span>
        </div>
        <ul className="grid gap-2">
          {venues.map((venue) => (
            <li
              key={venue.id}
              className="flex items-center gap-3 px-3 py-3"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: "var(--r-card)",
              }}
            >
              <div
                className="grid place-items-center"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "var(--field-soft)",
                  color: "var(--field)",
                  flex: "none",
                }}
              >
                <Glyph.pin size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[14px] font-semibold"
                  style={{ color: "var(--ink)" }}
                >
                  {venue.name}
                </div>
                <div
                  className="mono mt-0.5 truncate text-[11px]"
                  style={{ color: "var(--ink-muted)" }}
                >
                  {labels.sport[venue.sport]} · {venue.city}
                </div>
              </div>
              <Pill variant="default">{labels.distanceUnknown}</Pill>
              <a
                href={directionsHref(venue)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[12px] font-semibold"
                style={{
                  color: "var(--accent-deep)",
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid var(--line-2)",
                  minHeight: 32,
                }}
              >
                <Glyph.car size={14} />
                {labels.directions}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <p
        className="mt-2 text-[12px]"
        style={{ color: "var(--ink-muted)", lineHeight: 1.5 }}
      >
        {labels.privacyNotice}
      </p>
    </div>
  );
}
