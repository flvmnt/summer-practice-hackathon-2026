import { setRequestLocale } from "next-intl/server";
import { MapPageClient } from "@/components/map/MapPageClient";
import type { MapVenue } from "@/components/map/seed-venues";
import type { AppLocale } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth-current-user";
import { unreadCount } from "@/lib/notifications";
import type { SportKey } from "@/lib/sports";
import { getNearbyVenuesAction } from "@/lib/venues";

export const dynamic = "force-dynamic";

const FILTER_SPORTS: ReadonlyArray<SportKey> = [
  "football",
  "tennis",
  "running",
  "basketball",
];

const COPY = {
  en: {
    title: "Nearby venues",
    subtitle: "Public pickup spots near you. Map needs your location to plot you exactly.",
    searchPlaceholder: "Search venues",
    useMyLocation: "Use my location",
    allSports: "All sports",
    directions: "Directions",
    directionsGoogle: "Google Maps",
    directionsApple: "Apple Maps",
    directionsWaze: "Waze",
    join: "Join",
    startGame: "Start a game here",
    locationDeniedTitle: "Location unavailable",
    locationDeniedBody:
      "We can show events but cannot sort by distance. Your exact home address is never stored.",
    privacyNotice:
      "Privacy: we never store your exact home address. Pins shown are public venues only.",
    loadingMap: "Loading map",
    filtersLabel: "Filter venues",
    timeToday: "Today",
    timeTomorrow: "Tomorrow",
    distanceUnknown: "Distance unknown",
    priceFree: "Free",
    priceLow: "Low cost",
    priceMedium: "Medium cost",
    selectVenuePrompt: "Tap a pin to see venue details.",
    listHeader: "Public venues",
    fallbackHint: "Showing nearby venues by city.",
    back: "Back",
    sport: {
      football: "Football",
      basketball: "Basketball",
      tennis: "Tennis",
      volleyball: "Volleyball",
      badminton: "Badminton",
      running: "Running",
      cycling: "Cycling",
      yoga: "Yoga",
      hiking: "Hiking",
      table_tennis: "Table tennis",
    },
  },
  ro: {
    title: "Locuri din apropiere",
    subtitle:
      "Terenuri publice din apropiere. Harta are nevoie de locația ta pentru a te plasa exact.",
    searchPlaceholder: "Caută locuri",
    useMyLocation: "Folosește locația mea",
    allSports: "Toate sporturile",
    directions: "Direcții",
    directionsGoogle: "Google Maps",
    directionsApple: "Apple Maps",
    directionsWaze: "Waze",
    join: "Intră",
    startGame: "Începe un joc aici",
    locationDeniedTitle: "Locația indisponibilă",
    locationDeniedBody:
      "Putem afișa evenimente, dar nu le putem sorta după distanță. Adresa ta exactă nu este salvată niciodată.",
    privacyNotice:
      "Confidențialitate: nu salvăm niciodată adresa ta exactă. Punctele de pe hartă sunt doar locuri publice.",
    loadingMap: "Se încarcă harta",
    filtersLabel: "Filtrează locuri",
    timeToday: "Astăzi",
    timeTomorrow: "Mâine",
    distanceUnknown: "Distanță necunoscută",
    priceFree: "Gratis",
    priceLow: "Cost mic",
    priceMedium: "Cost mediu",
    selectVenuePrompt: "Apasă un punct pentru detalii.",
    listHeader: "Locuri publice",
    fallbackHint: "Afișăm locuri din oraș.",
    back: "Înapoi",
    sport: {
      football: "Fotbal",
      basketball: "Baschet",
      tennis: "Tenis",
      volleyball: "Volei",
      badminton: "Badminton",
      running: "Alergare",
      cycling: "Ciclism",
      yoga: "Yoga",
      hiking: "Drumeție",
      table_tennis: "Tenis de masă",
    },
  },
} as const;

export default async function MapPage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [result, user] = await Promise.all([
    getNearbyVenuesAction({ radiusKm: 10 }),
    getCurrentUser(),
  ]);
  const unread = user ? await unreadCount(user.id) : 0;
  const venues: ReadonlyArray<MapVenue> = result.ok
    ? result.data.venues.map((row) => ({
        id: row.id,
        name: row.name,
        city: row.address ?? "",
        sport: row.sport,
        lat: row.lat,
        lon: row.lng,
        priceTier: 0,
        eventAt: row.upcomingPublicEventCount > 0 ? new Date().toISOString() : null,
      }))
    : [];
  const labels = COPY[locale];

  return (
    <MapPageClient
      venues={venues}
      filterSports={FILTER_SPORTS}
      locale={locale}
      labels={labels}
      unreadCount={unread}
    />
  );
}
