"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Glyph } from "@/components/ui/Glyph";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { VenueRow } from "@/components/event/VenueRow";
import { SEED_VENUES, type MapVenue } from "@/components/map/seed-venues";
import type { AppLocale } from "@/i18n/routing";
import { createManualEventAction } from "@/lib/manual-event-actions";
import { SPORT_KEYS, type SportKey } from "@/lib/sports";

type Copy = {
  sportLabel: string;
  timeLabel: string;
  venueLabel: string;
  venueSearch: string;
  suggestedVenues: string;
  selectedVenue: string;
  submit: string;
  submitting: string;
  errorGeneric: string;
  sportLabels: Record<SportKey, string>;
};

const SPORT_GLYPH: Record<string, keyof typeof Glyph> = {
  football: "football",
  basketball: "basketball",
  tennis: "tennis",
  volleyball: "volley",
  badminton: "badminton",
  running: "running",
  cycling: "running",
  yoga: "pulse",
  hiking: "pin",
  table_tennis: "tennis",
};

function defaultDateTimeLocal(): string {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + 4);
  // YYYY-MM-DDTHH:mm
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

export function CreateEventForm({
  copy,
  locale,
}: {
  copy: Copy;
  locale: AppLocale;
}) {
  return (
    <ToastProvider>
      <CreateEventFormInner copy={copy} locale={locale} />
    </ToastProvider>
  );
}

function CreateEventFormInner({
  copy,
  locale,
}: {
  copy: Copy;
  locale: AppLocale;
}) {
  const toast = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sport, setSport] = useState<SportKey>("football");
  const [whenAt, setWhenAt] = useState<string>(() => defaultDateTimeLocal());
  const [venueQuery, setVenueQuery] = useState("");
  const [selectedVenue, setSelectedVenue] = useState<MapVenue | null>(null);

  const filteredVenues = useMemo(() => {
    const q = venueQuery.trim().toLowerCase();
    const all = SEED_VENUES.filter((v) => v.sport === sport || q.length > 0);
    if (q.length === 0) return all.slice(0, 4);
    return all
      .filter(
        (v) =>
          v.name.toLowerCase().includes(q) || v.city.toLowerCase().includes(q),
      )
      .slice(0, 4);
  }, [sport, venueQuery]);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createManualEventAction({
        sport,
        whenAt: new Date(whenAt).toISOString(),
        customLocationText: selectedVenue?.name ?? null,
      });
      if (!result.ok) {
        toast.push({
          title: copy.errorGeneric,
          description: result.error,
          variant: "alert",
        });
        return;
      }
      router.push(`/${locale}/events/${result.data.event.id}`);
    });
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={submit}
      style={{
        // Reserve room so the last field is not hidden behind the
        // sticky submit bar. 56px bar height + 12px breathing room.
        paddingBottom: 68,
      }}
    >
      <Select
        label={copy.sportLabel}
        value={sport}
        onChange={(e) => {
          setSport(e.target.value as SportKey);
          setSelectedVenue(null);
        }}
      >
        {SPORT_KEYS.map((key) => (
          <option key={key} value={key}>
            {copy.sportLabels[key]}
          </option>
        ))}
      </Select>

      <Input
        type="datetime-local"
        label={copy.timeLabel}
        value={whenAt}
        onChange={(e) => setWhenAt(e.target.value)}
      />

      <div className="flex flex-col gap-2">
        <Input
          label={copy.venueLabel}
          placeholder={copy.venueSearch}
          value={venueQuery}
          onChange={(e) => setVenueQuery(e.target.value)}
        />

        <div aria-live="polite">
          {selectedVenue ? (
            <div className="flex flex-col gap-1.5">
              <div
                className="mono text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ color: "var(--ink-muted)" }}
              >
                {copy.selectedVenue}
              </div>
              <VenueRow
                name={selectedVenue.name}
                sub={selectedVenue.city}
                primary
                weather={(() => {
                  const Icon = Glyph[SPORT_GLYPH[selectedVenue.sport] ?? "pin"];
                  return <Icon size={18} />;
                })()}
                actionLabel="Change"
                onAction={() => setSelectedVenue(null)}
              />
            </div>
          ) : null}
        </div>

        {!selectedVenue && filteredVenues.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            <div
              className="mono text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ color: "var(--ink-muted)" }}
            >
              {copy.suggestedVenues}
            </div>
            <div className="flex flex-col gap-2">
              {filteredVenues.map((venue) => {
                const Icon = Glyph[SPORT_GLYPH[venue.sport] ?? "pin"];
                return (
                  <button
                    key={venue.id}
                    type="button"
                    onClick={() => setSelectedVenue(venue)}
                    className="cursor-pointer border-0 bg-transparent p-0 text-left"
                  >
                    <VenueRow
                      name={venue.name}
                      sub={venue.city}
                      weather={<Icon size={18} />}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      {/*
       * Sticky submit CTA. Sits above the MobileTabBar (78px) on mobile and
       * pinned to the viewport bottom on md+ where the tabbar is hidden.
       * Mirrors the surface/blur/shadow tokens used by WizardStickyActionBar
       * so the action plane reads consistently across creation surfaces.
       */}
      <div
        className="fixed right-0 bottom-[78px] left-0 z-30 md:bottom-0 md:left-[240px]"
        style={{
          background: "color-mix(in oklch, var(--surface) 94%, transparent)",
          borderTop: "1px solid var(--line)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          paddingTop: 12,
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
          boxShadow: "0 -10px 28px -18px rgba(14, 26, 31, 0.22)",
        }}
      >
        <div className="mx-auto w-full max-w-xl px-5">
          <button
            type="submit"
            disabled={pending}
            aria-busy={pending}
            className="btn-s2m w-full"
            style={{ minHeight: 48, fontSize: 15 }}
          >
            <Glyph.plus size={16} />
            {pending ? copy.submitting : copy.submit}
          </button>
        </div>
      </div>
    </form>
  );
}
