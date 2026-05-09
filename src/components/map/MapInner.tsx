"use client";

import maplibregl, { type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
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

const OSM_RASTER_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap contributors",
      maxzoom: 19,
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

/**
 * Inner map renderer. Init happens once per `tileKey`; venues/userLocation/
 * selection updates are pushed into the live map instance via separate
 * effects so the map is never torn down mid-load when geolocation resolves
 * or the venue filter changes. Mirrors the pattern in /Users/flv/curbe.
 */
export function MapInner({
  venues,
  selectedVenueId,
  onSelectVenue,
  userLocation,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const onSelectRef = useRef(onSelectVenue);
  const [mapReady, setMapReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [reinitKey, setReinitKey] = useState(0);

  const tileKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;

  useEffect(() => {
    onSelectRef.current = onSelectVenue;
  }, [onSelectVenue]);

  // bfcache + WebGL-context-lost recovery (same pattern as curbe).
  useEffect(() => {
    function reinit() {
      const map = mapRef.current;
      if (map) {
        try {
          map.remove();
        } catch {
          // already torn down; ignore
        }
      }
      mapRef.current = null;
      markersRef.current.clear();
      setMapReady(false);
      setReinitKey((k) => k + 1);
    }
    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted) reinit();
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  // Init map once (per tileKey/reinit). Does NOT depend on venues/userLocation
  // so geolocation resolving or filter chips changing won't tear down a
  // half-loaded map.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;
    // Capture the markers map by reference so the cleanup function works on
    // the same Map instance the effect saw, not a later replacement.
    const markers = markersRef.current;
    let cancelled = false;

    const style: string | StyleSpecification = tileKey
      ? `https://api.maptiler.com/maps/dataviz/style.json?key=${tileKey}`
      : OSM_RASTER_STYLE;

    let instance: maplibregl.Map;
    try {
      instance = new maplibregl.Map({
        container,
        style,
        center: [DEFAULT_CENTER.lon, DEFAULT_CENTER.lat],
        zoom: 13,
        attributionControl: { compact: true },
        canvasContextAttributes: { preserveDrawingBuffer: true },
      });
    } catch {
      if (!cancelled) {
        queueMicrotask(() => setMapFailed(true));
      }
      return;
    }
    mapRef.current = instance;
    instance.addControl(
      new maplibregl.NavigationControl({ visualizePitch: false }),
      "top-right",
    );

    instance.on("load", () => {
      if (cancelled) return;
      setMapReady(true);
      // Resize once after first paint so an initially-zero-height container
      // (laid out after the map mounted) gets re-measured.
      requestAnimationFrame(() => instance.resize());
    });
    instance.on("error", () => {
      if (!cancelled) setMapFailed(true);
    });
    function onContextLost(e: Event) {
      e.preventDefault();
      try {
        instance.remove();
      } catch {
        // ignore
      }
      mapRef.current = null;
      markersRef.current.clear();
      setMapReady(false);
      setReinitKey((k) => k + 1);
    }
    instance.getCanvas().addEventListener("webglcontextlost", onContextLost);

    // Safety net: if `load` never fires (CSP, offline, broken tile host),
    // fall back to the SVG bg after 6s.
    const failTimer = window.setTimeout(() => {
      if (!cancelled && !mapRef.current?.loaded()) setMapFailed(true);
    }, 6000);

    // ResizeObserver: tab-switching to /map can leave the canvas at the wrong
    // size if the parent flexbox slot was 0px when init ran. Force a resize
    // whenever the container resizes.
    const ro = new ResizeObserver(() => {
      mapRef.current?.resize();
    });
    ro.observe(container);

    return () => {
      cancelled = true;
      window.clearTimeout(failTimer);
      ro.disconnect();
      try {
        instance.getCanvas().removeEventListener("webglcontextlost", onContextLost);
      } catch {
        // canvas already gone
      }
      try {
        instance.remove();
      } catch {
        // ignore
      }
      mapRef.current = null;
      markers.clear();
    };
  }, [tileKey, reinitKey]);

  // Sync markers with the venues prop. Add new, remove stale, recolor
  // existing — never tear down the map.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const markers = markersRef.current;
    const seen = new Set<string>();

    for (const venue of venues) {
      seen.add(venue.id);
      let marker = markers.get(venue.id);
      if (!marker) {
        const el = document.createElement("button");
        el.type = "button";
        el.setAttribute("aria-label", venue.name);
        el.style.width = "32px";
        el.style.height = "32px";
        el.style.borderRadius = "999px";
        el.style.border = "2px solid white";
        el.style.cursor = "pointer";
        el.style.boxShadow = "0 4px 10px rgba(14,26,31,0.25)";
        el.style.color = "white";
        el.style.fontSize = "14px";
        el.textContent = SPORT_LABEL[venue.sport] ?? "•";
        el.addEventListener("click", () => onSelectRef.current(venue.id));
        marker = new maplibregl.Marker({ element: el })
          .setLngLat([venue.lon, venue.lat])
          .addTo(map);
        markers.set(venue.id, marker);
      } else {
        marker.setLngLat([venue.lon, venue.lat]);
      }
      const isSelected = venue.id === selectedVenueId;
      const el = marker.getElement();
      el.style.background = venue.eventAt
        ? "var(--accent)"
        : isSelected
          ? "var(--accent-deep)"
          : "var(--field)";
      el.style.transform = isSelected ? "scale(1.15)" : "";
    }
    for (const [id, marker] of markers) {
      if (!seen.has(id)) {
        marker.remove();
        markers.delete(id);
      }
    }
  }, [venues, selectedVenueId, mapReady]);

  // Recenter when the user location resolves (or selected venue changes).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (selectedVenueId) {
      const v = venues.find((x) => x.id === selectedVenueId);
      if (v) {
        map.flyTo({ center: [v.lon, v.lat], zoom: 14, duration: 600 });
        return;
      }
    }
    const center = userLocation ?? DEFAULT_CENTER;
    map.flyTo({ center: [center.lon, center.lat], zoom: 13, duration: 600 });
  }, [userLocation, selectedVenueId, venues, mapReady]);

  if (!mapFailed) {
    return (
      <div
        className="relative h-full w-full"
        style={{ background: "var(--bg-alt)" }}
      >
        <div ref={containerRef} className="absolute inset-0" />
        {!mapReady ? (
          <div
            aria-hidden
            className="absolute inset-0 grid place-items-center"
            style={{ background: "var(--bg-alt)" }}
          >
            <div
              className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
              style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
            />
          </div>
        ) : null}
      </div>
    );
  }

  // SVG fallback when MapLibre cannot initialise (offline / CSP / WebGL off).
  const center = userLocation ?? DEFAULT_CENTER;
  const VIEW_W = 390;
  const VIEW_H = 768;
  const SPAN_LON = 0.022;
  const SPAN_LAT = 0.014;

  function project(lat: number, lon: number) {
    const x = ((lon - center.lon) / SPAN_LON) * (VIEW_W / 2) + VIEW_W / 2;
    const y = -((lat - center.lat) / SPAN_LAT) * (VIEW_H / 2) + VIEW_H / 2;
    return {
      x: Math.max(20, Math.min(VIEW_W - 20, x)),
      y: Math.max(40, Math.min(VIEW_H - 40, y)),
    };
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
