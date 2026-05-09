import type { ReactNode } from "react";
import { Glyph } from "@/components/ui/Glyph";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

export type CaptainBriefMember = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  status: "confirmed" | "pending" | "declined";
};

type Props = {
  members: ReadonlyArray<CaptainBriefMember>;
  suggestedVenue?: { name: string; sub?: string } | null;
  suggestedTime?: string | null;
  weather?: { label: string; icon?: ReactNode } | null;
  className?: string;
};

const statusMeta: Record<
  CaptainBriefMember["status"],
  { color: string; ring: string }
> = {
  confirmed: {
    color: "var(--field)",
    ring: "var(--field-soft)",
  },
  pending: {
    color: "var(--warn-token)",
    ring: "var(--warn-soft)",
  },
  declined: {
    color: "var(--alert)",
    ring: "var(--alert-soft)",
  },
};

export function CaptainBriefPanel({
  members,
  suggestedVenue,
  suggestedTime,
  weather,
  className,
}: Props) {
  const confirmed = members.filter((m) => m.status === "confirmed").length;
  return (
    <section
      aria-label="Captain brief"
      className={cn("flex flex-col gap-3 p-4", className)}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-surface)",
        boxShadow: "var(--shadow-2)",
      }}
    >
      <header className="flex items-center gap-2">
        <span
          className="grid place-items-center"
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "var(--warn-soft)",
            color: "var(--warn-token)",
          }}
          aria-hidden
        >
          <Glyph.crown size={16} />
        </span>
        <h3
          className="display"
          style={{ fontSize: 18, lineHeight: 1.1, color: "var(--ink)" }}
        >
          Captain brief
        </h3>
        <span
          className="mono ml-auto text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: "var(--ink-muted)" }}
        >
          {confirmed}/{members.length} confirmed
        </span>
      </header>

      {/* Members row */}
      <ul aria-label="Members" className="flex flex-wrap gap-2">
        {members.map((m) => {
          const meta = statusMeta[m.status];
          return (
            <li key={m.id} className="flex items-center gap-2">
              <span
                className="grid place-items-center rounded-full p-0.5"
                style={{ background: meta.ring }}
              >
                <Avatar src={m.avatarUrl} name={m.name} size={28} />
              </span>
              <span className="text-[12px]" style={{ color: "var(--ink-2)" }}>
                {m.name}
              </span>
              <span
                aria-hidden
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: meta.color,
                }}
              />
            </li>
          );
        })}
      </ul>

      {/* Venue + time + weather */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {suggestedVenue ? (
          <BriefStat
            icon={<Glyph.pin size={16} />}
            label="Venue"
            value={suggestedVenue.name}
            sub={suggestedVenue.sub}
          />
        ) : null}
        {suggestedTime ? (
          <BriefStat
            icon={<Glyph.clock size={16} />}
            label="Kickoff"
            value={suggestedTime}
          />
        ) : null}
        {weather ? (
          <BriefStat
            icon={weather.icon ?? <Glyph.sun size={16} />}
            label="Weather"
            value={weather.label}
          />
        ) : null}
      </div>
    </section>
  );
}

type StatProps = {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
};

function BriefStat({ icon, label, value, sub }: StatProps) {
  return (
    <div
      className="flex items-start gap-2 p-3"
      style={{
        background: "var(--surface-2)",
        borderRadius: 12,
      }}
    >
      <span
        className="grid place-items-center"
        style={{ color: "var(--ink-muted)", flex: "none", marginTop: 2 }}
        aria-hidden
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div
          className="mono text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: "var(--ink-muted)" }}
        >
          {label}
        </div>
        <div
          className="truncate text-[13px] font-semibold"
          style={{ color: "var(--ink)" }}
        >
          {value}
        </div>
        {sub ? (
          <div className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
            {sub}
          </div>
        ) : null}
      </div>
    </div>
  );
}
