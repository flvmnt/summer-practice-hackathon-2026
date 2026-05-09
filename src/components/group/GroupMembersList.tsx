import type { CSSProperties } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Glyph } from "@/components/ui/Glyph";
import { Pill } from "@/components/ui/Pill";
import { cn } from "@/lib/utils";

export type GroupMember = {
  userId: string;
  fullName: string;
  username?: string;
  role: string;
  status: string;
  avatarUrl?: string | null;
};

type Props = {
  members: ReadonlyArray<GroupMember>;
  captainUserId?: string | null;
  copy: {
    membersAriaLabel: string;
    captainBadge: string;
    playerBadge: string;
    statusConfirmed: string;
    statusMaybe: string;
    statusPending: string;
  };
  className?: string;
};

const statusStyle: Record<
  string,
  { label: keyof Props["copy"]; bg: string; color: string }
> = {
  confirmed: {
    label: "statusConfirmed",
    bg: "var(--field-soft)",
    color: "var(--field)",
  },
  maybe: {
    label: "statusMaybe",
    bg: "var(--warn-soft)",
    color: "var(--warn-token)",
  },
  pending: {
    label: "statusPending",
    bg: "var(--surface-2)",
    color: "var(--ink-muted)",
  },
};

function statusFor(status: string) {
  return statusStyle[status] ?? statusStyle.pending!;
}

export function GroupMembersList({
  members,
  captainUserId,
  copy,
  className,
}: Props) {
  return (
    <ul
      className={cn("flex flex-col gap-2", className)}
      aria-label={copy.membersAriaLabel}
    >
      {members.map((member) => {
        const isCaptain =
          captainUserId !== null &&
          captainUserId !== undefined &&
          member.userId === captainUserId;
        const meta = statusFor(member.status);
        const labelKey = meta.label;
        const statusLabel = copy[labelKey];
        const chipStyle: CSSProperties = {
          background: meta.bg,
          color: meta.color,
          borderRadius: 999,
          padding: "3px 9px",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.02em",
        };

        return (
          <li
            key={member.userId}
            className="flex items-center gap-3 px-3 py-2.5"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: "var(--r-card)",
            }}
          >
            <Avatar src={member.avatarUrl} name={member.fullName} size={36} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span
                  className="truncate text-[14px] font-semibold"
                  style={{ color: "var(--ink)" }}
                >
                  {member.fullName}
                </span>
                {isCaptain ? (
                  <span
                    aria-hidden
                    className="grid h-4 w-4 place-items-center"
                    style={{ color: "var(--accent)", flex: "none" }}
                  >
                    <Glyph.crown size={14} />
                  </span>
                ) : null}
              </div>
              <div className="mt-1">
                {isCaptain ? (
                  <Pill variant="accent" icon={<Glyph.crown size={11} />}>
                    {copy.captainBadge}
                  </Pill>
                ) : (
                  <Pill variant="alt">{copy.playerBadge}</Pill>
                )}
              </div>
            </div>
            <span style={chipStyle}>{statusLabel}</span>
          </li>
        );
      })}
    </ul>
  );
}
