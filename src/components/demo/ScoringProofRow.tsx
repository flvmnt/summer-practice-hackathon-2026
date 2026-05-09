import Link from "next/link";
import { Glyph } from "@/components/ui/Glyph";
import { cn } from "@/lib/utils";

export type ScoringProofStatus = "live" | "seeded" | "fallback" | "pending";

export type ScoringProof = {
  id: string;
  label: string;
  status: ScoringProofStatus;
  evidence?: string; // url or short string
  evidenceLabel?: string;
};

type Props = ScoringProof & { className?: string };

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
  evidence,
  evidenceLabel,
  className,
}: Props) {
  const meta = statusMeta[status];
  const isExternal = evidence?.startsWith("http");
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5",
        className,
      )}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-card)",
      }}
    >
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
        {meta.label}
      </span>
      <span
        className="flex-1 truncate text-[13px] font-semibold"
        style={{ color: "var(--ink)" }}
      >
        {label}
      </span>
      {evidence ? (
        isExternal ? (
          <a
            href={evidence}
            target="_blank"
            rel="noopener noreferrer"
            className="mono inline-flex items-center gap-1 text-[11px] font-semibold"
            style={{ color: "var(--accent-deep)" }}
          >
            {evidenceLabel ?? "evidence"}
            <Glyph.arrow size={12} />
          </a>
        ) : (
          <Link
            href={evidence}
            className="mono inline-flex items-center gap-1 text-[11px] font-semibold"
            style={{ color: "var(--accent-deep)" }}
          >
            {evidenceLabel ?? "evidence"}
            <Glyph.arrow size={12} />
          </Link>
        )
      ) : null}
    </div>
  );
}
