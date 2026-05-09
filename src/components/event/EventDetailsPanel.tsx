"use client";

import { useCallback, useMemo } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Glyph } from "@/components/ui/Glyph";
import { Pill } from "@/components/ui/Pill";
import { useToast } from "@/components/ui/Toast";
import { MapBg } from "@/components/map/MapBg";
import { IcsExportButton } from "@/components/event/IcsExportButton";
import { RsvpButtons, type RsvpStatus } from "@/components/event/RsvpButtons";
import { VenueRow } from "@/components/event/VenueRow";
import type { SportKey } from "@/lib/sports";

type WeatherFit = "outdoor_good" | "indoor_recommended" | "wind_warning" | "cold_warning";

export type EventDetailsCopy = {
  sportLabel: string;
  whenLabel: string;
  durationLabel: string; // "{m} min"
  venuePending: string;
  weatherTitle: string;
  weatherFit: Record<WeatherFit, string>;
  weatherMetrics: string; // already-formatted "{t}°C · {r}% rain · {w} km/h"
  directions: string;
  copyInvite: string;
  inviteCopied: string;
  inviteCopyError: string;
  ics: string;
  icsToast: string;
  rsvp: { going: string; maybe: string; no: string; saved: string };
  mapPreviewLabel: string;
  priceTier: string; // pre-localized
  distanceKm: string | null;
};

type Props = {
  copy: EventDetailsCopy;
  event: {
    id: string;
    sport: SportKey;
    whenAt: string;
    durationMin: number;
  };
  venue: {
    name: string;
    lat: number | null;
    lng: number | null;
    distanceKm: string | null;
    priceTier: string;
  } | null;
  weather: {
    fit: WeatherFit;
    temperatureC: number;
    rainProbability: number;
    windKmh: number;
  } | null;
  initialRsvp: RsvpStatus;
};

function weatherGlyph(fit: WeatherFit) {
  switch (fit) {
    case "outdoor_good":
      return <Glyph.sun size={18} />;
    case "indoor_recommended":
      return <Glyph.rain size={18} />;
    case "wind_warning":
      return <Glyph.wind size={18} />;
    case "cold_warning":
      return <Glyph.cloud size={18} />;
  }
}

export function EventDetailsPanel({
  copy,
  event,
  venue,
  weather,
  initialRsvp,
}: Props) {
  const toast = useToast();

  const directionsHref = useMemo(() => {
    if (!venue || venue.lat === null || venue.lng === null) return null;
    return `https://maps.google.com/?q=${venue.lat},${venue.lng}`;
  }, [venue]);

  const onCopyInvite = useCallback(async () => {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.push({ title: copy.inviteCopied, variant: "success" });
    } catch {
      toast.push({ title: copy.inviteCopyError, variant: "alert" });
    }
  }, [copy.inviteCopied, copy.inviteCopyError, toast]);

  return (
    <div className="grid gap-4">
      {/* When + duration */}
      <Card variant="card" className="p-4">
        <div className="flex items-center gap-2">
          <Pill variant="field" icon={<Glyph.clock size={14} />}>
            {copy.sportLabel}
          </Pill>
          <span
            className="mono text-[11px]"
            style={{ color: "var(--ink-muted)" }}
          >
            {copy.durationLabel}
          </span>
        </div>
        <p
          className="display mt-3"
          style={{ fontSize: 22, lineHeight: 1.15, color: "var(--ink)" }}
        >
          {copy.whenLabel}
        </p>
      </Card>

      {/* Venue */}
      <Card variant="card" className="p-4">
        <div
          className="mono mb-2 text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: "var(--ink-muted)" }}
        >
          Venue
        </div>
        {venue ? (
          <VenueRow
            name={venue.name}
            sub={
              [
                copy.distanceKm ? `${copy.distanceKm} km` : null,
                copy.priceTier,
              ]
                .filter(Boolean)
                .join(" · ") || undefined
            }
            weather={weatherGlyph(weather?.fit ?? "outdoor_good")}
            primary
          />
        ) : (
          <p
            className="text-[13px]"
            style={{ color: "var(--ink-muted)", padding: "12px 14px" }}
          >
            {copy.venuePending}
          </p>
        )}

        {/* Map preview */}
        <div
          aria-label={copy.mapPreviewLabel}
          className="relative mt-3 overflow-hidden"
          style={{
            height: 140,
            borderRadius: 14,
            border: "1px solid var(--line)",
          }}
        >
          <MapBg showMe />
        </div>

        {/* Actions */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {directionsHref ? (
            <a
              href={directionsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-s2m btn-secondary"
              style={{
                padding: "10px 14px",
                minHeight: 44,
                fontSize: 13,
                gap: 6,
                textDecoration: "none",
              }}
            >
              <Glyph.car size={16} />
              {copy.directions}
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="btn-s2m btn-secondary"
              style={{
                padding: "10px 14px",
                minHeight: 44,
                fontSize: 13,
                gap: 6,
                opacity: 0.5,
                cursor: "not-allowed",
              }}
            >
              <Glyph.car size={16} />
              {copy.directions}
            </button>
          )}
          <button
            type="button"
            onClick={onCopyInvite}
            className="btn-s2m btn-secondary"
            style={{
              padding: "10px 14px",
              minHeight: 44,
              fontSize: 13,
              gap: 6,
            }}
          >
            <Glyph.copy size={16} />
            {copy.copyInvite}
          </button>
        </div>
      </Card>

      {/* Weather */}
      {weather ? (
        <Card variant="card" className="p-4">
          <div className="flex items-center gap-2">
            {weatherGlyph(weather.fit)}
            <h3
              className="text-[13px] font-bold"
              style={{ color: "var(--ink)" }}
            >
              {copy.weatherTitle}
            </h3>
            <Badge
              variant={
                weather.fit === "outdoor_good"
                  ? "field"
                  : weather.fit === "indoor_recommended"
                    ? "alert"
                    : "default"
              }
              className="ml-auto"
            >
              {weather.fit.replace("_", " ")}
            </Badge>
          </div>
          <p
            className="mt-2 text-[13px]"
            style={{ color: "var(--ink-2)", lineHeight: 1.5 }}
          >
            {copy.weatherFit[weather.fit]}
          </p>
          <p
            className="mono mt-2 text-[11px]"
            style={{ color: "var(--ink-muted)" }}
          >
            {copy.weatherMetrics}
          </p>
        </Card>
      ) : null}

      {/* RSVP */}
      <Card variant="card" className="p-4">
        <div
          className="mono mb-3 text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: "var(--ink-muted)" }}
        >
          RSVP
        </div>
        <RsvpButtons eventId={event.id} initial={initialRsvp} copy={copy.rsvp} />
      </Card>

      {/* ICS export */}
      <IcsExportButton
        eventId={event.id}
        title={copy.sportLabel}
        whenAt={event.whenAt}
        durationMin={event.durationMin}
        venueName={venue?.name}
        label={copy.ics}
        toastTitle={copy.icsToast}
      />
    </div>
  );
}
