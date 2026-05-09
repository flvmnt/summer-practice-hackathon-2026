import {
  ScoringProofRow,
  type ScoringProof,
} from "@/components/demo/ScoringProofRow";

type Props = {
  id?: string;
  label: string;
  rows: ReadonlyArray<ScoringProof>;
  statusLabels: Record<ScoringProof["status"], string>;
};

export function RubricSection({ id, label, rows, statusLabels }: Props) {
  const subtotal = rows.reduce((acc, row) => acc + (row.points ?? 0), 0);
  const liveOrSeeded = rows.filter(
    (row) => row.status === "live" || row.status === "seeded",
  ).length;
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-heading` : undefined}
      className="flex scroll-mt-24 flex-col gap-3"
    >
      <header
        className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b pb-2"
        style={{ borderColor: "var(--line)" }}
      >
        <h2
          id={id ? `${id}-heading` : undefined}
          className="display text-[18px] sm:text-[20px]"
          style={{ color: "var(--ink)" }}
        >
          {label}
        </h2>
        <div className="flex items-baseline gap-2">
          <span
            className="mono text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: "var(--ink-muted)" }}
          >
            {liveOrSeeded}/{rows.length}
          </span>
          <span
            className="mono text-[12px] font-bold tabular-nums"
            style={{ color: "var(--ink)" }}
          >
            {subtotal.toLocaleString()}p
          </span>
        </div>
      </header>
      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <ScoringProofRow
            key={row.id}
            {...row}
            statusLabel={statusLabels[row.status]}
          />
        ))}
      </div>
    </section>
  );
}
