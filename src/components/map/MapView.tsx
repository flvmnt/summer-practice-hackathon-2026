"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/Skeleton";
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
  loading: () => null,
});

/**
 * Lazy MapLibre wrapper. Lazy-loads `MapInner` on the client only.
 * Falls back to a skeleton while the chunk is loading; `MapInner` itself
 * has its own MapBg fallback if MapLibre cannot initialise.
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
    >
      <Skeleton
        ariaLabel={loadingLabel}
        className="absolute inset-0"
        height="100%"
        width="100%"
      />
      <div className="absolute inset-0">
        <MapInner
          venues={venues}
          selectedVenueId={selectedVenueId}
          onSelectVenue={onSelectVenue}
          userLocation={userLocation}
        />
      </div>
    </div>
  );
}
