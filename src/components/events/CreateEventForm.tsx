"use client";

import { useMemo, useState, useTransition } from "react";
import { Glyph } from "@/components/ui/Glyph";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { VenueRow } from "@/components/event/VenueRow";
import { SEED_VENUES, type MapVenue } from "@/components/map/seed-venues";
import { SPORT_KEYS, type SportKey } from "@/lib/sports";

type Copy = {
  sportLabel: string;
  timeLabel: string;
  venueLabel: string;
  venueSearch: string;
  suggestedVenues: string;
  selectedVenue: string;
  submit: string;
  comingSoon: string;
  sportLabels: Record<SportKey, string>;
};

const SPORT_GLYPH: Record<string, keyof typeof Glyph> = {
  football: "football",
  basketball: "basketball",
  tennis: "tennis",
  volleyball: "volley",
  badminton: "tennis",
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

export function CreateEventForm({ copy }: { copy: Copy }) {
  return (
    <ToastProvider>
      <CreateEventFormInner copy={copy} />
    </ToastProvider>
  );
}

function CreateEventFormInner({ copy }: { copy: Copy }) {
  const toast = useToast();
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
    // TODO(A12 backend): wire to a real createManualEventAction once the
    // server contract supports public events without an active group.
    // For now the existing createGroupEventAction requires a captain and a
    // groupId, so a true manual event is out of scope.
    startTransition(() => {
      toast.push({
        title: "Event creation coming soon",
        description: copy.comingSoon,
      });
    });
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={submit}>
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

      <button
        type="submit"
        disabled={pending}
        className="btn-s2m"
        style={{ minHeight: 48, fontSize: 15 }}
      >
        <Glyph.plus size={16} />
        {copy.submit}
      </button>
    </form>
  );
}
