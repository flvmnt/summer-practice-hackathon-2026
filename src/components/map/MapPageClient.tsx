"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Glyph } from "@/components/ui/Glyph";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { HeaderBell } from "@/components/layout/HeaderBell";
import { MapDeniedFallback } from "./MapDeniedFallback";
import { MapFilters, type TimeFilter } from "./MapFilters";
import { MapVenueSheet } from "./MapVenueSheet";
import { MapView } from "./MapView";
import { type MapVenue } from "./seed-venues";
import type { SportKey } from "@/lib/sports";

type Labels = {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  useMyLocation: string;
  allSports: string;
  directions: string;
  directionsGoogle: string;
  directionsApple: string;
  directionsWaze: string;
  join: string;
  startGame: string;
  locationDeniedTitle: string;
  locationDeniedBody: string;
  privacyNotice: string;
  loadingMap: string;
  filtersLabel: string;
  timeToday: string;
  timeTomorrow: string;
  distanceUnknown: string;
  priceFree: string;
  priceLow: string;
  priceMedium: string;
  selectVenuePrompt: string;
  listHeader: string;
  fallbackHint: string;
  back: string;
  venueDetailsAria: string;
  sport: Record<SportKey, string>;
};

type GeoStatus = "pending" | "granted" | "denied" | "unsupported";

type Props = {
  venues: ReadonlyArray<MapVenue>;
  filterSports: ReadonlyArray<SportKey>;
  locale: string;
  labels: Labels;
  unreadCount: number;
};

export function MapPageClient({
  venues,
  filterSports,
  locale,
  labels,
  unreadCount,
}: Props) {
  const [search, setSearch] = useState("");
  const [selectedSports, setSelectedSports] = useState<ReadonlyArray<SportKey>>([]);
  const [selectedTime, setSelectedTime] = useState<TimeFilter>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("pending");
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoStatus("unsupported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Privacy: round to ~200m precision before storing in state.
        const lat = Math.round(position.coords.latitude * 500) / 500;
        const lon = Math.round(position.coords.longitude * 500) / 500;
        setUserLocation({ lat, lon });
        setGeoStatus("granted");
      },
      () => {
        setGeoStatus("denied");
        setUserLocation(null);
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 8_000 },
    );
  }, []);

  useEffect(() => {
    // Defer the geolocation request to a microtask so the synchronous setState
    // calls live inside the browser callback (not the effect body).
    const id = window.setTimeout(() => requestLocation(), 0);
    return () => window.clearTimeout(id);
  }, [requestLocation]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return venues.filter((venue) => {
      if (selectedSports.length > 0 && !selectedSports.includes(venue.sport)) {
        return false;
      }
      if (term && !venue.name.toLowerCase().includes(term) && !venue.city.toLowerCase().includes(term)) {
        return false;
      }
      // Time filter: only matters if eventAt is set; without an event we keep it
      // visible so the page is never empty during the demo.
      if (selectedTime && venue.eventAt) {
        const eventDate = new Date(venue.eventAt);
        const now = new Date();
        const todayISO = now.toISOString().slice(0, 10);
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowISO = tomorrow.toISOString().slice(0, 10);
        const eventISO = eventDate.toISOString().slice(0, 10);
        if (selectedTime === "today" && eventISO !== todayISO) return false;
        if (selectedTime === "tomorrow" && eventISO !== tomorrowISO) return false;
      }
      return true;
    });
  }, [venues, search, selectedSports, selectedTime]);

  const selectedVenue = useMemo(
    () => filtered.find((venue) => venue.id === selectedVenueId) ?? filtered[0] ?? null,
    [filtered, selectedVenueId],
  );

  const handleToggleSport = useCallback((sport: SportKey) => {
    setSelectedSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport],
    );
  }, []);

  const handleSelectVenue = useCallback((id: string) => {
    setSelectedVenueId(id);
    setSheetExpanded(true);
  }, []);

  const filterLabels = {
    allSports: labels.allSports,
    today: labels.timeToday,
    tomorrow: labels.timeTomorrow,
    sport: labels.sport,
    filtersLabel: labels.filtersLabel,
  };

  const sheetLabels = {
    selectPrompt: labels.selectVenuePrompt,
    directions: labels.directions,
    join: labels.join,
    startGame: labels.startGame,
    sport: labels.sport,
    priceFree: labels.priceFree,
    priceLow: labels.priceLow,
    priceMedium: labels.priceMedium,
    directionsGoogle: labels.directionsGoogle,
    directionsApple: labels.directionsApple,
    directionsWaze: labels.directionsWaze,
    venueDetailsAria: labels.venueDetailsAria,
  };

  const deniedLabels = {
    title: labels.locationDeniedTitle,
    body: labels.locationDeniedBody,
    useMyLocation: labels.useMyLocation,
    listHeader: labels.listHeader,
    fallbackHint: labels.fallbackHint,
    privacyNotice: labels.privacyNotice,
    directions: labels.directions,
    distanceUnknown: labels.distanceUnknown,
    sport: labels.sport,
  };

  const showFallback = geoStatus === "denied" || geoStatus === "unsupported";

  return (
    <main
      className="relative w-full md:pl-[240px]"
      style={{ minHeight: "100dvh", background: "var(--bg)" }}
    >      <div className="mx-auto flex w-full max-w-6xl flex-col md:grid md:grid-cols-[320px_1fr] md:gap-0">
        {/* Sidebar (desktop) / top header (mobile) */}
        <aside
          className="flex flex-col gap-3 px-4 pt-4 md:h-[100dvh] md:overflow-y-auto md:border-r md:px-5 md:py-6"
          style={{ borderColor: "var(--line)", background: "var(--surface)" }}
        >
          <div className="flex items-center gap-2">
            <Link
              href={`/${locale}/today`}
              aria-label={labels.back}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full"
              style={{ background: "var(--surface-2)", color: "var(--ink)" }}
            >
              <Glyph.back size={20} />
            </Link>
            <div className="min-w-0 flex-1">
              <h1
                className="display truncate"
                style={{ fontSize: 22, lineHeight: 1.1, color: "var(--ink)" }}
              >
                {labels.title}
              </h1>
              <p
                className="mt-0.5 truncate text-[12px]"
                style={{ color: "var(--ink-muted)" }}
              >
                {labels.subtitle}
              </p>
            </div>
            <HeaderBell unreadCount={unreadCount} locale={locale} />
          </div>

          <Input
            placeholder={labels.searchPlaceholder}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label={labels.searchPlaceholder}
          />

          <MapFilters
            sports={filterSports}
            selectedSports={selectedSports}
            selectedTime={selectedTime}
            onToggleSport={handleToggleSport}
            onToggleTime={setSelectedTime}
            labels={filterLabels}
          />

          {/* Desktop venue list */}
          <div className="hidden md:mt-2 md:flex md:flex-col md:gap-2">
            {filtered.length === 0 ? (
              <p
                className="px-2 py-4 text-center text-[13px]"
                style={{ color: "var(--ink-muted)" }}
              >
                {labels.selectVenuePrompt}
              </p>
            ) : (
              filtered.map((venue) => {
                const isSelected = selectedVenue?.id === venue.id;
                return (
                  <button
                    key={venue.id}
                    type="button"
                    onClick={() => handleSelectVenue(venue.id)}
                    aria-pressed={isSelected}
                    className="flex cursor-pointer items-center gap-3 border-0 px-3 py-3 text-left"
                    style={{
                      background: isSelected ? "var(--accent-tint)" : "var(--surface-2)",
                      borderRadius: "var(--r-card)",
                      boxShadow: isSelected
                        ? "inset 0 0 0 1px color-mix(in oklch, var(--accent) 25%, transparent)"
                        : "inset 0 0 0 1px var(--line)",
                    }}
                  >
                    <div
                      className="grid place-items-center"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: venue.eventAt ? "var(--accent-soft)" : "var(--field-soft)",
                        color: venue.eventAt ? "var(--accent-deep)" : "var(--field)",
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
                  </button>
                );
              })
            )}
          </div>

          <p
            className="hidden md:mt-auto md:block md:pt-4 md:text-[11px]"
            style={{ color: "var(--ink-muted)", lineHeight: 1.5 }}
          >
            {labels.privacyNotice}
          </p>
        </aside>

        {/* Map area. Mobile reserves space for the bottom tab bar (78px);
            desktop has no bottom bar so the map gets the full viewport.
            Inline styles trump Tailwind, so use class-only sizing here. */}
        <section
          className={
            showFallback
              ? "relative h-auto w-full"
              : "relative w-full h-[calc(100dvh-78px-env(safe-area-inset-bottom))] md:h-[100dvh]"
          }
        >
          {showFallback ? (
            <div className="px-4 py-5 md:px-8 md:py-8">
              <MapDeniedFallback
                venues={filtered}
                onRetry={requestLocation}
                labels={deniedLabels}
              />
            </div>
          ) : (
            <>
              <MapView
                venues={filtered}
                selectedVenueId={selectedVenue?.id ?? null}
                onSelectVenue={handleSelectVenue}
                userLocation={userLocation}
                loadingLabel={labels.loadingMap}
              />
              <div
                className="absolute top-3 right-3 flex flex-col gap-2"
                style={{ zIndex: 10 }}
              >
                <IconButton
                  ariaLabel={labels.useMyLocation}
                  variant="solid"
                  onClick={requestLocation}
                >
                  <Glyph.pin size={18} />
                </IconButton>
              </div>
            </>
          )}
        </section>
      </div>

      {!showFallback ? (
        <MapVenueSheet
          venue={selectedVenue}
          expanded={sheetExpanded}
          onToggleExpanded={() => setSheetExpanded((prev) => !prev)}
          labels={sheetLabels}
        />
      ) : null}    </main>
  );
}
