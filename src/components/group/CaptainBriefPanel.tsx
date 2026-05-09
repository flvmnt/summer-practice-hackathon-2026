import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Glyph } from "@/components/ui/Glyph";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
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
  /**
   * Optional UI flag controlling first/third-person empty-state copy.
   * Pure presentational - does not change the data contract.
   */
  viewerIsCaptain?: boolean;
  /**
   * Optional UI flag. When true, the venue/time/weather rows render as
   * skeletons while the brief is being computed upstream.
   */
  loading?: boolean;
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

// The current parent passes a literal "Pick a venue" stub when there is no
// real venue. Treat that as empty so the polished empty state shows even
// before the data plumbing PR lands.
const VENUE_STUB_NAME = "Pick a venue";

export async function CaptainBriefPanel({
  members,
  suggestedVenue,
  suggestedTime,
  weather,
  viewerIsCaptain = false,
  loading = false,
  className,
}: Props) {
  const t = await getTranslations("group.captainBriefPanel");
  const confirmed = members.filter((m) => m.status === "confirmed").length;
  const total = members.length;

  const hasVenue = Boolean(
    suggestedVenue &&
      suggestedVenue.name &&
      suggestedVenue.name !== VENUE_STUB_NAME,
  );
  const hasTime = Boolean(suggestedTime);
  const hasWeather = Boolean(weather);
  const allEmpty = !hasVenue && !hasTime && !hasWeather;
  const role = viewerIsCaptain ? "captain" : "viewer";

  return (
    <section
      aria-label={t("ariaLabel")}
      aria-live="polite"
      aria-busy={loading}
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
            borderRadius: "var(--r-chip)",
            background: "var(--accent-soft)",
            color: "var(--accent-deep)",
          }}
          aria-hidden
        >
          <Glyph.crown size={16} />
        </span>
        <h3
          className="display"
          style={{ fontSize: 18, lineHeight: 1.1, color: "var(--ink)" }}
        >
          {t("header")}
        </h3>
        <span
          className="mono ml-auto text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: "var(--ink-muted)" }}
        >
          {t("confirmedSummary", { confirmed, total })}
        </span>
      </header>

      {/* Squad row */}
      <div className="flex flex-col gap-1.5">
        <span
          className="mono text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: "var(--ink-muted)" }}
        >
          {t("squadLabel")}
        </span>
        <ul
          aria-label={t("squadLabel")}
          className="flex flex-wrap gap-x-3 gap-y-2"
        >
          {members.map((m) => {
            const meta = statusMeta[m.status];
            return (
              <li
                key={m.id}
                className="flex items-center gap-2"
                title={t(`status.${m.status}`)}
              >
                <span
                  className="grid place-items-center rounded-full p-0.5"
                  style={{ background: meta.ring }}
                >
                  <Avatar src={m.avatarUrl} name={m.name} size={28} />
                </span>
                <span
                  className="text-[12px]"
                  style={{ color: "var(--ink-2)" }}
                >
                  {m.name}
                </span>
                <span
                  role="img"
                  aria-label={t(`status.${m.status}`)}
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
      </div>

      {/* Plan section: venue + kickoff + weather */}
      <div className="flex flex-col gap-2">
        <span
          className="mono text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: "var(--ink-muted)" }}
        >
          {t("planLabel")}
        </span>

        {loading ? (
          <div className="grid grid-cols-1 gap-2">
            <BriefStatSkeleton />
            <BriefStatSkeleton />
            <BriefStatSkeleton />
          </div>
        ) : allEmpty ? (
          <BriefEmpty
            heading={t("empty.heading")}
            body={t(`empty.body.${role}`)}
          />
        ) : (
          <div className="grid grid-cols-1 gap-2">
            <BriefStat
              icon={<Glyph.pin size={16} />}
              label={t("sections.venue")}
              value={hasVenue ? suggestedVenue!.name : null}
              sub={hasVenue ? suggestedVenue?.sub : undefined}
              emptyValue={t(`empty.venue.${role}`)}
            />
            <BriefStat
              icon={<Glyph.clock size={16} />}
              label={t("sections.kickoff")}
              value={hasTime ? suggestedTime! : null}
              emptyValue={t(`empty.kickoff.${role}`)}
            />
            <BriefStat
              icon={weather?.icon ?? <Glyph.sun size={16} />}
              label={t("sections.weather")}
              value={hasWeather ? weather!.label : null}
              emptyValue={t(`empty.weather.${role}`)}
            />
          </div>
        )}
      </div>
    </section>
  );
}

type StatProps = {
  icon: ReactNode;
  label: string;
  value: string | null;
  sub?: string;
  emptyValue: string;
};

function BriefStat({ icon, label, value, sub, emptyValue }: StatProps) {
  const isEmpty = value === null || value === undefined || value === "";
  return (
    <div
      className="flex items-start gap-2 p-3"
      style={{
        background: "var(--surface-2)",
        borderRadius: "var(--r-card)",
        minHeight: "var(--tap-target)",
      }}
    >
      <span
        className="grid place-items-center"
        style={{
          color: isEmpty ? "var(--ink-faint)" : "var(--ink-muted)",
          flex: "none",
          marginTop: 2,
          width: 20,
          height: 20,
        }}
        aria-hidden
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div
          className="mono text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: "var(--ink-muted)" }}
        >
          {label}
        </div>
        {isEmpty ? (
          <div
            className="text-[12px] leading-snug"
            style={{ color: "var(--ink-muted)" }}
          >
            {emptyValue}
          </div>
        ) : (
          <>
            <div
              className="truncate text-[13px] font-semibold"
              style={{ color: "var(--ink)" }}
            >
              {value}
            </div>
            {sub ? (
              <div
                className="truncate text-[11px]"
                style={{ color: "var(--ink-muted)" }}
              >
                {sub}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function BriefStatSkeleton() {
  return (
    <div
      className="flex items-start gap-2 p-3"
      style={{
        background: "var(--surface-2)",
        borderRadius: "var(--r-card)",
        minHeight: "var(--tap-target)",
      }}
      aria-hidden
    >
      <Skeleton width={20} height={20} radius="var(--r-chip)" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Skeleton width="40%" height={8} radius={999} />
        <Skeleton width="80%" height={12} radius={999} />
      </div>
    </div>
  );
}

function BriefEmpty({ heading, body }: { heading: string; body: string }) {
  return (
    <div
      className="flex items-start gap-3 p-3"
      style={{
        background: "var(--surface-2)",
        borderRadius: "var(--r-card)",
        border: "1px dashed var(--line-2)",
        minHeight: "var(--tap-target)",
      }}
    >
      <span
        className="grid place-items-center"
        style={{
          width: 28,
          height: 28,
          borderRadius: "var(--r-chip)",
          background: "var(--accent-soft)",
          color: "var(--accent-deep)",
          flex: "none",
        }}
        aria-hidden
      >
        <Glyph.cal size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <div
          className="text-[13px] font-semibold"
          style={{ color: "var(--ink)" }}
        >
          {heading}
        </div>
        <div
          className="mt-0.5 text-[12px] leading-snug"
          style={{ color: "var(--ink-muted)" }}
        >
          {body}
        </div>
      </div>
    </div>
  );
}
