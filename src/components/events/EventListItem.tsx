import Link from "next/link";
import { Glyph } from "@/components/ui/Glyph";
import { Pill } from "@/components/ui/Pill";
import type { SportKey } from "@/lib/sports";

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

export type RsvpStatusLite = "going" | "maybe" | "declined" | "unknown";

export type EventListItemProps = {
  href: string;
  title: string;
  sport: SportKey;
  whenLabel: string;
  venueLabel: string | null;
  rsvp: RsvpStatusLite;
  rsvpLabels: Record<"going" | "maybe" | "declined", string>;
  past?: boolean;
};

export function EventListItem({
  href,
  title,
  sport,
  whenLabel,
  venueLabel,
  rsvp,
  rsvpLabels,
  past,
}: EventListItemProps) {
  const SportIcon = Glyph[SPORT_GLYPH[sport] ?? "cal"];

  const rsvpLabel =
    rsvp === "going"
      ? rsvpLabels.going
      : rsvp === "maybe"
        ? rsvpLabels.maybe
        : rsvp === "declined"
          ? rsvpLabels.declined
          : null;

  const rsvpVariant: "field" | "alt" | "default" =
    rsvp === "going" ? "field" : rsvp === "maybe" ? "alt" : "default";

  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3"
      style={{
        background: "var(--surface)",
        borderRadius: "var(--r-card)",
        border: "1px solid var(--line)",
        color: "var(--ink)",
        textDecoration: "none",
        opacity: past ? 0.7 : 1,
      }}
    >
      <span
        aria-hidden
        className="grid place-items-center"
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: past ? "var(--surface-2)" : "var(--accent-soft)",
          color: past ? "var(--ink-muted)" : "var(--accent-deep)",
          flex: "none",
        }}
      >
        <SportIcon size={20} />
      </span>

      <div className="min-w-0 flex-1">
        <div
          className="display truncate"
          style={{ fontSize: 15, lineHeight: 1.2, color: "var(--ink)" }}
        >
          {title}
        </div>
        <div
          className="mt-0.5 flex items-center gap-2 truncate text-[12px]"
          style={{ color: "var(--ink-muted)" }}
        >
          <Glyph.clock size={12} />
          <span className="truncate">{whenLabel}</span>
          {venueLabel ? (
            <>
              <span aria-hidden>·</span>
              <Glyph.pin size={12} />
              <span className="truncate">{venueLabel}</span>
            </>
          ) : null}
        </div>
      </div>

      {rsvpLabel ? (
        <Pill variant={rsvpVariant}>
          {rsvpLabel}
        </Pill>
      ) : null}

      <span
        aria-hidden
        style={{ color: "var(--ink-muted)", marginLeft: 4 }}
      >
        <Glyph.chevron size={14} />
      </span>
    </Link>
  );
}
