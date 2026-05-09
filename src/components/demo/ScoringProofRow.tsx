import Link from "next/link";
import { Glyph } from "@/components/ui/Glyph";
import { cn } from "@/lib/utils";

export type ScoringProofStatus = "live" | "seeded" | "fallback" | "pending";

export type ScoringProof = {
  id: string;
  label: string;
  status: ScoringProofStatus;
  points?: number;
  evidence?: string; // url or short string
  evidenceLabel?: string;
  note?: string;
};

type Props = ScoringProof & {
  className?: string;
  statusLabel?: string;
};

const statusMeta: Record<
  ScoringProofStatus,
  { color: string; soft: string; label: string }
> = {
  live: {
    color: "var(--field)",
    soft: "var(--field-soft)",
    label: "Live",
  },
  seeded: {
    color: "var(--accent-deep)",
    soft: "var(--accent-soft)",
    label: "Seeded",
  },
  fallback: {
    color: "var(--warn-token)",
    soft: "var(--warn-soft)",
    label: "Fallback",
  },
  pending: {
    color: "var(--ink-muted)",
    soft: "var(--surface-2)",
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
        className="mono inline-flex items-center gap-1 text-[11px] font-semibold whitespace-nowrap"
        style={{ color: "var(--accent-deep)" }}
      >
        {evidenceLabel ?? "evidence"}
        <Glyph.arrow size={12} />
      </a>
    ) : (
      <Link
        href={evidence}
        className="mono inline-flex items-center gap-1 text-[11px] font-semibold whitespace-nowrap"
        style={{ color: "var(--accent-deep)" }}
      >
        {evidenceLabel ?? "evidence"}
        <Glyph.arrow size={12} />
      </Link>
    )
  ) : null;

  return (
    <div
      className={cn("flex flex-col gap-1.5 px-3 py-2.5", className)}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-card)",
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className="mono inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{
            background: meta.soft,
            color: meta.color,
            borderRadius: 6,
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
                background: meta.color,
              }}
            />
          ) : null}
          {statusLabel ?? meta.label}
        </span>
        <span
          className="min-w-0 flex-1 truncate text-[13px] font-semibold"
          style={{ color: "var(--ink)" }}
        >
          {label}
        </span>
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
      {note ? (
        <p
          className="pl-[76px] text-[11px] leading-snug"
          style={{ color: "var(--ink-muted)" }}
        >
          {note}
        </p>
      ) : null}
    </div>
  );
}
