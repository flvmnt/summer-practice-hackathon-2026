import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Glyph } from "@/components/ui/Glyph";
import { Pill } from "@/components/ui/Pill";
import type { SportKey } from "@/lib/sports";

type Member = {
  userId: string;
  fullName: string;
};

export type GroupListItemProps = {
  href: string;
  sport: SportKey;
  sportLabel: string;
  memberCount: number;
  sizeTarget: number;
  members: ReadonlyArray<Member>;
  isCaptain: boolean;
  captainBadgeLabel: string;
  openLabel: string;
  countLabel: string;
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

export function GroupListItem({
  href,
  sport,
  sportLabel,
  memberCount,
  members,
  isCaptain,
  captainBadgeLabel,
  openLabel,
  countLabel,
}: GroupListItemProps) {
  const SportIcon = Glyph[SPORT_GLYPH[sport] ?? "groups"];
  // Stack up to 4 avatars for a tight row.
  const stack = members.slice(0, 4);

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
      }}
    >
      <span
        aria-hidden
        className="grid place-items-center"
        style={{
          width: 40,
          height: 40,
          borderRadius: "var(--r-chip)",
          background: "var(--accent-soft)",
          color: "var(--accent-deep)",
          flex: "none",
        }}
      >
        <SportIcon size={20} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className="display truncate"
            style={{ fontSize: 15, lineHeight: 1.2, color: "var(--ink)" }}
          >
            {sportLabel}
          </span>
          {isCaptain ? (
            <Pill icon={<Glyph.crown size={11} />} variant="accent">
              {captainBadgeLabel}
            </Pill>
          ) : null}
        </div>
        <div
          className="mt-0.5 truncate text-[12px]"
          style={{ color: "var(--ink-muted)" }}
        >
          {countLabel}
        </div>
      </div>

      <div
        className="flex items-center"
        style={{ marginRight: 8 }}
        aria-hidden
      >
        {stack.map((member, idx) => (
          <span
            key={member.userId}
            style={{
              marginLeft: idx === 0 ? 0 : -8,
              boxShadow: "0 0 0 2px var(--surface)",
              borderRadius: 999,
            }}
          >
            <Avatar name={member.fullName} size={24} />
          </span>
        ))}
        {memberCount > stack.length ? (
          <span
            className="grid place-items-center"
            style={{
              marginLeft: -8,
              width: 24,
              height: 24,
              borderRadius: 999,
              background: "var(--surface-2)",
              color: "var(--ink-muted)",
              fontSize: 10,
              fontWeight: 700,
              boxShadow: "0 0 0 2px var(--surface)",
            }}
          >
            +{memberCount - stack.length}
          </span>
        ) : null}
      </div>

      <span
        aria-label={openLabel}
        className="grid place-items-center"
        style={{
          width: 32,
          height: 32,
          borderRadius: 999,
          background: "var(--surface-2)",
          color: "var(--ink-muted)",
        }}
      >
        <Glyph.chevron size={14} />
      </span>
    </Link>
  );
}
