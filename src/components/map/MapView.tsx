"use client";

import dynamic from "next/dynamic";
import type { MapVenue } from "./seed-venues";

type Props = {
  venues: ReadonlyArray<MapVenue>;
  selectedVenueId: string | null;
  onSelectVenue: (id: string) => void;
  userLocation: { lat: number; lon: number } | null;
  loadingLabel: string;
};

const MapInner = dynamic(() => import("./MapInner").then((m) => m.MapInner), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      aria-label="Loading map"
      className="absolute inset-0 grid place-items-center"
      style={{ background: "var(--bg-alt)" }}
    >
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
        style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
      />
    </div>
  ),
});

/**
 * Lazy MapLibre wrapper. Lazy-loads `MapInner` on the client only. Loading
 * state lives in `next/dynamic`'s loading slot - no separate skeleton layer
 * stacked on top of the map (that previously hid `MapInner` once it mounted).
 */
export function MapView({
  venues,
  selectedVenueId,
  onSelectVenue,
  userLocation,
  loadingLabel,
}: Props) {
  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ background: "var(--bg-alt)" }}
      aria-label={loadingLabel}
    >
      <MapInner
        venues={venues}
        selectedVenueId={selectedVenueId}
        onSelectVenue={onSelectVenue}
        userLocation={userLocation}
      />
    </div>
  );
}
