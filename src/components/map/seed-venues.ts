import type { SportKey } from "@/lib/sports";

export type MapVenue = {
  id: string;
  name: string;
  city: string;
  sport: SportKey;
  /** Public venue lat/lng — never user home coords. */
  lat: number;
  lon: number;
  /** 0 = free, 1 = low, 2 = medium */
  priceTier: 0 | 1 | 2;
  /** Optional active event time (ISO) for pin coloring. */
  eventAt?: string | null;
};

/**
 * @deprecated Public `/map` reads from `getNearbyVenuesAction` in `@/lib/venues`.
 * Remaining importers (e.g. CreateEventForm) should migrate to the action and
 * this fixture should be removed once they do.
 */
export const SEED_VENUES: ReadonlyArray<MapVenue> = [
  {
    id: "baza2",
    name: "Baza Sportivă 2",
    city: "Timișoara",
    sport: "football",
    lat: 45.7645,
    lon: 21.2161,
    priceTier: 2,
    eventAt: null,
  },
  {
    id: "parcul-rozelor",
    name: "Parcul Rozelor",
    city: "Timișoara",
    sport: "running",
    lat: 45.7537,
    lon: 21.2309,
    priceTier: 0,
    eventAt: null,
  },
  {
    id: "malul-begai",
    name: "Malul Begăi",
    city: "Timișoara",
    sport: "cycling",
    lat: 45.7489,
    lon: 21.2087,
    priceTier: 0,
    eventAt: null,
  },
  {
    id: "terenuri-centrale",
    name: "Terenuri Centrale",
    city: "Timișoara",
    sport: "tennis",
    lat: 45.756,
    lon: 21.229,
    priceTier: 1,
    eventAt: null,
  },
  {
    id: "padurea-verde",
    name: "Pădurea Verde",
    city: "Timișoara",
    sport: "hiking",
    lat: 45.7814,
    lon: 21.2678,
    priceTier: 0,
    eventAt: null,
  },
];

/**
 * Default map center for Timișoara when geolocation is unavailable.
 */
export const DEFAULT_CENTER = { lat: 45.7537, lon: 21.2257 } as const;
