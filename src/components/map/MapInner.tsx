"use client";

import { useEffect, useRef, useState } from "react";
import { MapBg } from "./MapBg";
import { MapPin } from "./MapPin";
import type { MapVenue } from "./seed-venues";
import { DEFAULT_CENTER } from "./seed-venues";
import type { SportKey } from "@/lib/sports";

type Props = {
  venues: ReadonlyArray<MapVenue>;
  selectedVenueId: string | null;
  onSelectVenue: (id: string) => void;
  userLocation: { lat: number; lon: number } | null;
};

const SPORT_LABEL: Record<SportKey, string> = {
  football: "⚽",
  basketball: "🏀",
  tennis: "🎾",
  volleyball: "🏐",
  badminton: "🏸",
  running: "🏃",
  cycling: "🚴",
  yoga: "🧘",
  hiking: "🥾",
  table_tennis: "🏓",
};

/**
 * Inner map renderer — tries MapLibre when a public tile key is configured,
 * otherwise falls back to the abstract `MapBg` SVG with venue pins translated
 * from lat/lon to viewport coordinates. Always client-only.
 *
 * The MapLibre real-tile path is wired but gated by env to keep CSP and
 * network-free demo builds working out of the box.
 */
export function MapInner({
  venues,
  selectedVenueId,
  onSelectVenue,
  userLocation,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mapLibreReady, setMapLibreReady] = useState(false);
  const [mapLibreFailed, setMapLibreFailed] = useState(false);

  const tileKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  const wantsRealMap = Boolean(tileKey);

  useEffect(() => {
    if (!wantsRealMap || !containerRef.current) return;
    let map: { remove: () => void } | null = null;
    let cancelled = false;

    (async () => {
      try {
        const maplibre = await import("maplibre-gl");
        await import("maplibre-gl/dist/maplibre-gl.css").catch(() => {
          /* CSS may already be bundled or unavailable; ignore. */
        });
        if (cancelled || !containerRef.current) return;

        const center = userLocation ?? DEFAULT_CENTER;
        const instance = new maplibre.Map({
          container: containerRef.current,
          style: `https://api.maptiler.com/maps/dataviz/style.json?key=${tileKey}`,
          center: [center.lon, center.lat],
          zoom: 13,
          attributionControl: { compact: true },
        });
        instance.addControl(new maplibre.NavigationControl({ visualizePitch: false }), "top-right");

        instance.on("load", () => {
          if (cancelled) return;
          for (const venue of venues) {
            const el = document.createElement("button");
            el.type = "button";
            el.setAttribute("aria-label", venue.name);
            el.style.width = "32px";
            el.style.height = "32px";
            el.style.borderRadius = "999px";
            el.style.border = "2px solid white";
            el.style.cursor = "pointer";
            el.style.background = venue.eventAt ? "var(--accent)" : "var(--field)";
            el.style.boxShadow = "0 4px 10px rgba(14,26,31,0.25)";
            el.style.color = "white";
            el.style.fontSize = "14px";
            el.textContent = SPORT_LABEL[venue.sport] ?? "•";
            el.addEventListener("click", () => onSelectVenue(venue.id));
            new maplibre.Marker({ element: el })
              .setLngLat([venue.lon, venue.lat])
              .addTo(instance);
          }
          setMapLibreReady(true);
        });

        instance.on("error", () => {
          if (!cancelled) setMapLibreFailed(true);
        });

        map = instance;
      } catch {
        if (!cancelled) setMapLibreFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [wantsRealMap, tileKey, venues, onSelectVenue, userLocation]);

  // Recenter when selected venue changes (real-map path only).
  useEffect(() => {
    // No-op placeholder; real-map recenter happens above on load.
    void selectedVenueId;
  }, [selectedVenueId]);

  if (wantsRealMap && !mapLibreFailed) {
    return (
      <div className="relative h-full w-full" style={{ background: "var(--bg-alt)" }}>
        <div ref={containerRef} className="absolute inset-0" />
        {!mapLibreReady ? (
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: "var(--bg-alt)" }}
          />
        ) : null}
      </div>
    );
  }

  // SVG fallback: project lat/lon → viewport based on a small bounding box
  // around the chosen center. Pins are clickable.
  const center = userLocation ?? DEFAULT_CENTER;
  const VIEW_W = 390;
  const VIEW_H = 768;
  // ~1.6 km half-span horizontally, 3 km vertically
  const SPAN_LON = 0.022;
  const SPAN_LAT = 0.014;

  function project(lat: number, lon: number) {
    const x = ((lon - center.lon) / SPAN_LON) * (VIEW_W / 2) + VIEW_W / 2;
    const y = -((lat - center.lat) / SPAN_LAT) * (VIEW_H / 2) + VIEW_H / 2;
    return { x: Math.max(20, Math.min(VIEW_W - 20, x)), y: Math.max(40, Math.min(VIEW_H - 40, y)) };
  }

  return (
    <div className="relative h-full w-full">
      <MapBg showMe={Boolean(userLocation)}>
        <>
          {venues.map((venue) => {
            const { x, y } = project(venue.lat, venue.lon);
            const isSelected = venue.id === selectedVenueId;
            const color = venue.eventAt
              ? "var(--accent)"
              : isSelected
                ? "var(--accent-deep)"
                : "var(--field)";
            return (
              <g
                key={venue.id}
                style={{ cursor: "pointer" }}
                onClick={() => onSelectVenue(venue.id)}
                role="button"
                aria-label={venue.name}
              >
                <MapPin
                  x={x}
                  y={y}
                  color={color}
                  label={SPORT_LABEL[venue.sport] ?? "•"}
                  big={isSelected}
                />
              </g>
            );
          })}
        </>
      </MapBg>
    </div>
  );
}

export default MapInner;
