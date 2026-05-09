import Link from "next/link";
import { Glyph } from "@/components/ui/Glyph";
import { cn } from "@/lib/utils";

export type ScoringProofStatus = "live" | "seeded" | "fallback" | "pending";

export type ScoringProof = {
  id: string;
  label: string;
  status: ScoringProofStatus;
  points?: number;
  evidence?: string;
  evidenceLabel?: string;
  note?: string;
};

type Props = ScoringProof & {
  className?: string;
  statusLabel?: string;
};

const statusMeta: Record<
  ScoringProofStatus,
  { color: string; soft: string; ink: string; label: string }
> = {
  live: {
    color: "var(--field)",
    soft: "var(--field-soft)",
    ink: "var(--field)",
    label: "Live",
  },
  seeded: {
    color: "var(--accent-deep)",
    soft: "var(--accent-soft)",
    ink: "var(--accent-deep)",
    label: "Seeded",
  },
  fallback: {
    color: "var(--warn-token)",
    soft: "var(--warn-soft)",
    ink: "var(--warn-token)",
    label: "Fallback",
  },
  pending: {
    // --ink-2 over --surface-2 keeps pending text WCAG AA.
    color: "var(--ink-2)",
    soft: "var(--surface-2)",
    ink: "var(--ink-muted)",
    label: "Pending",
  },
};

export function ScoringProofRow({
  label,
  status,
  points,
  evidence,
  evidenceLabel,
  note,
  className,
  statusLabel,
}: Props) {
  const meta = statusMeta[status];
  const isExternal = evidence?.startsWith("http");
  const evidenceContent = evidence ? (
    isExternal ? (
      <a
        href={evidence}
        target="_blank"
        rel="noopener noreferrer"
        className="mono inline-flex items-center gap-1 text-[11px] font-semibold whitespace-nowrap underline-offset-2 hover:underline focus-visible:underline"
        style={{ color: "var(--accent-deep)" }}
      >
        {evidenceLabel ?? "evidence"}
        <Glyph.arrow size={12} />
      </a>
    ) : (
      <Link
        href={evidence}
        className="mono inline-flex items-center gap-1 text-[11px] font-semibold whitespace-nowrap underline-offset-2 hover:underline focus-visible:underline"
        style={{ color: "var(--accent-deep)" }}
      >
        {evidenceLabel ?? "evidence"}
        <Glyph.arrow size={12} />
      </Link>
    )
  ) : null;

  const statusBadge = (
    <span
      className="mono inline-flex shrink-0 items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
      style={{
        background: meta.soft,
        color: meta.color,
        borderRadius: "var(--r-chip)",
        minWidth: 64,
        justifyContent: "center",
      }}
    >
      {status === "live" ? (
        <span
          aria-hidden
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: meta.ink,
          }}
        />
      ) : null}
      {statusLabel ?? meta.label}
    </span>
  );

  return (
    <div
      className={cn("flex flex-col gap-2 px-3 py-3 sm:px-4", className)}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-card)",
      }}
    >
      {/* Title row: badge stacks above label on mobile so a long label cannot
          push the pill off-screen; from sm:+ they sit side by side. */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        {statusBadge}
        <h4
          className="min-w-0 flex-1 text-[14px] font-semibold leading-snug sm:truncate"
          style={{ color: "var(--ink)" }}
          title={label}
        >
          {label}
        </h4>
      </div>

      {note ? (
        <p
          className="text-[12px] leading-snug"
          style={{ color: "var(--ink-muted)" }}
        >
          {note}
        </p>
      ) : null}

      {(typeof points === "number" || evidenceContent) ? (
        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
          {typeof points === "number" ? (
            <span
              className="mono text-[11px] font-bold tabular-nums whitespace-nowrap"
              style={{ color: "var(--ink-muted)" }}
            >
              {points.toLocaleString()}p
            </span>
          ) : null}
          {evidenceContent}
        </div>
      ) : null}
    </div>
  );
}
