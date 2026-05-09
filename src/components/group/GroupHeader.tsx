import Link from "next/link";
import type { ReactNode } from "react";
import { Glyph } from "@/components/ui/Glyph";
import { Pill } from "@/components/ui/Pill";
import { cn } from "@/lib/utils";

type Props = {
  sportLabel: string;
  memberCount: number;
  sizeTarget: number;
  captainName?: string | null;
  backHref: string;
  backLabel: string;
  className?: string;
  /** Optional trailing slot (e.g., <HeaderBell />). */
  rightSlot?: ReactNode;
};

/**
 * Compact group header: back button, sport name, member count, captain pill.
 * Sticky when used at the top of the mobile group screen so the count + captain
 * stay above the fold during chat scroll.
 */
export function GroupHeader({
  sportLabel,
  memberCount,
  sizeTarget,
  captainName,
  backHref,
  backLabel,
  className,
  rightSlot,
}: Props) {
  return (
    <header
      className={cn(
        "flex items-center gap-3 px-4 py-3",
        className,
      )}
      style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <Link
        href={backHref}
        aria-label={backLabel}
        className="grid h-10 w-10 place-items-center rounded-full"
        style={{
          color: "var(--ink)",
          background: "transparent",
          flex: "none",
        }}
      >
        <Glyph.back size={20} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h1
            className="display truncate"
            style={{ fontSize: 16, lineHeight: 1.15, color: "var(--ink)" }}
          >
            {sportLabel}
          </h1>
          <span
            className="mono text-[11px] font-bold tracking-[0.04em]"
            style={{ color: "var(--ink-muted)" }}
          >
            {memberCount}/{sizeTarget}
          </span>
        </div>
        {captainName ? (
          <div className="mt-1 flex items-center gap-1.5">
            <Pill variant="accent" icon={<Glyph.crown size={12} />}>
              {captainName}
            </Pill>
          </div>
        ) : null}
      </div>
      {rightSlot ? <div className="flex-none">{rightSlot}</div> : null}
    </header>
  );
}
