import {
  ScoringProofRow,
  type ScoringProof,
} from "@/components/demo/ScoringProofRow";

type Props = {
  label: string;
  rows: ReadonlyArray<ScoringProof>;
};

export function RubricSection({ label, rows }: Props) {
  const subtotal = rows.reduce((acc, row) => acc + (row.points ?? 0), 0);
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <h3
          className="text-[13px] font-bold uppercase tracking-[0.14em]"
          style={{ color: "var(--ink-muted)" }}
        >
          {label}
        </h3>
        <span
          className="mono text-[11px] font-semibold tabular-nums"
          style={{ color: "var(--ink-muted)" }}
        >
          {subtotal.toLocaleString()}p
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <ScoringProofRow key={row.id} {...row} />
        ))}
      </div>
    </section>
  );
}
