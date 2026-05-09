"use client";

import { Pill } from "@/components/ui/Pill";
import { Glyph } from "@/components/ui/Glyph";
import type { SportKey } from "@/lib/sports";
import { cn } from "@/lib/utils";

export type TimeFilter = "today" | "tomorrow" | null;

export type MapFiltersProps = {
  sports: ReadonlyArray<SportKey>;
  selectedSports: ReadonlyArray<SportKey>;
  selectedTime: TimeFilter;
  onToggleSport: (sport: SportKey) => void;
  onToggleTime: (time: TimeFilter) => void;
  labels: {
    allSports: string;
    today: string;
    tomorrow: string;
    sport: Record<SportKey, string>;
    filtersLabel: string;
  };
  className?: string;
};

/**
 * Horizontal scroll row of multi-select filter chips.
 * Sport chips + Today/Tomorrow time chips. Selected use --accent.
 */
export function MapFilters({
  sports,
  selectedSports,
  selectedTime,
  onToggleSport,
  onToggleTime,
  labels,
  className,
}: MapFiltersProps) {
  const noSportsSelected = selectedSports.length === 0;
  return (
    <div
      role="toolbar"
      aria-label={labels.filtersLabel}
      className={cn("flex items-center gap-1.5 overflow-x-auto", className)}
      style={{
        padding: "4px 2px",
        scrollbarWidth: "none",
        scrollSnapType: "x proximity",
        WebkitOverflowScrolling: "touch",
        WebkitMaskImage:
          "linear-gradient(90deg, black 0, black calc(100% - 24px), transparent 100%)",
        maskImage:
          "linear-gradient(90deg, black 0, black calc(100% - 24px), transparent 100%)",
      }}
    >
      <button
        type="button"
        onClick={() => sports.forEach((s) => selectedSports.includes(s) && onToggleSport(s))}
        aria-pressed={noSportsSelected}
        className="cursor-pointer border-0 bg-transparent p-0"
        style={{ flex: "none" }}
      >
        <Pill variant={noSportsSelected ? "accent" : "default"} icon={<Glyph.filter size={12} />}>
          {labels.allSports}
        </Pill>
      </button>
      {sports.map((sport) => {
        const active = selectedSports.includes(sport);
        return (
          <button
            key={sport}
            type="button"
            onClick={() => onToggleSport(sport)}
            aria-pressed={active}
            className="cursor-pointer border-0 bg-transparent p-0"
            style={{ flex: "none" }}
          >
            <Pill variant={active ? "accent" : "default"}>{labels.sport[sport]}</Pill>
          </button>
        );
      })}
      <span
        aria-hidden
        style={{
          width: 1,
          height: 18,
          background: "var(--line)",
          margin: "0 4px",
          flex: "none",
        }}
      />
      <button
        type="button"
        onClick={() => onToggleTime(selectedTime === "today" ? null : "today")}
        aria-pressed={selectedTime === "today"}
        className="cursor-pointer border-0 bg-transparent p-0"
        style={{ flex: "none" }}
      >
        <Pill
          variant={selectedTime === "today" ? "field" : "default"}
          icon={<Glyph.clock size={12} />}
        >
          {labels.today}
        </Pill>
      </button>
      <button
        type="button"
        onClick={() => onToggleTime(selectedTime === "tomorrow" ? null : "tomorrow")}
        aria-pressed={selectedTime === "tomorrow"}
        className="cursor-pointer border-0 bg-transparent p-0"
        style={{ flex: "none" }}
      >
        <Pill
          variant={selectedTime === "tomorrow" ? "field" : "default"}
          icon={<Glyph.cal size={12} />}
        >
          {labels.tomorrow}
        </Pill>
      </button>
    </div>
  );
}
