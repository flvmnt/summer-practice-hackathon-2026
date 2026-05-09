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

  // Header row: back button + title + bell. Same on mobile and desktop.
  const headerBar = (
    <div className="flex items-center gap-2 px-4 py-3 md:px-6 md:py-4">
      <Link
        href={`/${locale}/today`}
        aria-label={labels.back}
        className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-full"
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
  );

  // Search + filters strip. Mobile: stacked. Desktop: same strip across the
  // top of the page (above both list and map), per user request.
  const searchAndFilters = (
    <div className="flex flex-col gap-2 px-4 pb-3 md:flex-row md:items-center md:gap-3 md:px-6 md:pb-4">
      <div className="md:max-w-sm md:flex-1">
        <Input
          placeholder={labels.searchPlaceholder}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label={labels.searchPlaceholder}
        />
      </div>
      <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:flex-1 md:overflow-visible md:px-0">
        <MapFilters
          sports={filterSports}
          selectedSports={selectedSports}
          selectedTime={selectedTime}
          onToggleSport={handleToggleSport}
          onToggleTime={setSelectedTime}
          labels={filterLabels}
        />
      </div>
    </div>
  );

  return (
    <main
      className="relative w-full overflow-hidden md:pl-[240px]"
      style={{ height: "100dvh", background: "var(--bg)" }}
    >
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col">
        {/* Top header (search/filters live here on desktop, per request). */}
        <header
          className="flex-none border-b"
          style={{ borderColor: "var(--line)", background: "var(--surface)" }}
        >
          {headerBar}
          {searchAndFilters}
        </header>

        {/* Body: takes remaining height. min-h-0 lets the map shrink to fit. */}
        <div className="flex min-h-0 flex-1">
          {/* Desktop venue list (hidden on mobile). */}
          <aside
            className="hidden md:flex md:w-[320px] md:flex-none md:flex-col md:border-r"
            style={{
              borderColor: "var(--line)",
              background: "var(--surface)",
            }}
          >
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-4">
              {filtered.length === 0 ? (
                <p
                  className="px-2 py-6 text-center text-[13px]"
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
                        background: isSelected
                          ? "var(--accent-tint)"
                          : "var(--surface-2)",
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
                          background: venue.eventAt
                            ? "var(--accent-soft)"
                            : "var(--field-soft)",
                          color: venue.eventAt
                            ? "var(--accent-deep)"
                            : "var(--field)",
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
              className="flex-none border-t px-4 py-3 text-[11px]"
              style={{
                color: "var(--ink-muted)",
                lineHeight: 1.5,
                borderColor: "var(--line)",
              }}
            >
              {labels.privacyNotice}
            </p>
          </aside>

          {/* Map area. min-w-0 + flex-1 fills remaining width. Mobile pads
              the bottom by the tab-bar height so the map never sits under
              the fixed tab bar; desktop has no tab bar so md:!pb-0. */}
          <section
            className="relative min-h-0 min-w-0 flex-1 pb-[calc(78px+env(safe-area-inset-bottom))] md:pb-0"
          >
            {showFallback ? (
              <div className="h-full overflow-y-auto px-4 py-5 md:px-6 md:py-6">
                <MapDeniedFallback
                  venues={filtered}
                  onRetry={requestLocation}
                  labels={deniedLabels}
                />
              </div>
            ) : (
              <div className="relative h-full w-full">
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
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Mobile-only venue sheet, anchored above the bottom tab bar. */}
      {!showFallback ? (
        <div className="md:hidden">
          <MapVenueSheet
            venue={selectedVenue}
            expanded={sheetExpanded}
            onToggleExpanded={() => setSheetExpanded((prev) => !prev)}
            labels={sheetLabels}
          />
        </div>
      ) : null}
    </main>
  );
}
