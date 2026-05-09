import { Avatar } from "@/components/ui/Avatar";
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

export type PublicProfileCardProps = {
  fullName: string;
  username: string;
  bio: string | null;
  city: string | null;
  photoUrl: string | null;
  sports: ReadonlyArray<{ sport: SportKey; level: number; label: string }>;
  cityLabel: string;
  sportsLabel: string;
};

/**
 * Public profile header card. Renders avatar, name, username, bio, city,
 * sport chips. No exact location is ever surfaced — only city.
 */
export function PublicProfileCard({
  fullName,
  username,
  bio,
  city,
  photoUrl,
  sports,
  cityLabel,
  sportsLabel,
}: PublicProfileCardProps) {
  return (
    <section
      className="flex flex-col items-center gap-4 px-5 py-6 md:flex-row md:items-start md:gap-6"
      style={{
        background: "var(--surface)",
        borderRadius: "var(--r-surface)",
        border: "1px solid var(--line)",
        boxShadow: "var(--shadow-2)",
      }}
    >
      <span
        style={{
          padding: 4,
          borderRadius: 999,
          background: "var(--field-soft)",
          flex: "none",
        }}
      >
        <Avatar name={fullName} src={photoUrl} size={96} />
      </span>

      <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center md:items-start md:text-left">
        <div className="flex flex-col">
          <h1
            className="display"
            style={{ fontSize: 28, lineHeight: 1.05, color: "var(--ink)" }}
          >
            {fullName}
          </h1>
          <span
            className="mono"
            style={{
              fontSize: 12,
              color: "var(--ink-muted)",
              letterSpacing: "0.06em",
            }}
          >
            @{username}
          </span>
        </div>

        {bio ? (
          <p
            className="max-w-xl text-[14px]"
            style={{ color: "var(--ink-muted)", lineHeight: 1.5 }}
          >
            {bio}
          </p>
        ) : null}

        {city ? (
          <div
            className="flex items-center gap-1.5 text-[12px]"
            style={{ color: "var(--ink-muted)" }}
          >
            <Glyph.pin size={12} />
            <span className="mono uppercase tracking-[0.06em]">
              {cityLabel}
            </span>
            <span style={{ color: "var(--ink)", fontWeight: 600 }}>{city}</span>
          </div>
        ) : null}

        {sports.length > 0 ? (
          <div className="mt-1 flex flex-col items-center gap-1.5 md:items-start">
            <span
              className="mono text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ color: "var(--ink-muted)" }}
            >
              {sportsLabel}
            </span>
            <div className="flex flex-wrap justify-center gap-1.5 md:justify-start">
              {sports.map((entry) => {
                const Icon = Glyph[SPORT_GLYPH[entry.sport] ?? "pulse"];
                return (
                  <Pill key={entry.sport} icon={<Icon size={12} />}>
                    {entry.label}
                  </Pill>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
