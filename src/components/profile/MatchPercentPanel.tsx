import { Glyph } from "@/components/ui/Glyph";

export type MatchBreakdownRow = {
  label: string;
  value: number; // 0-100
};

export type MatchPercentPanelProps = {
  title: string;
  subtitle: string;
  percent: number; // 0-100
  breakdown: ReadonlyArray<MatchBreakdownRow>;
};

/**
 * Compatibility readout for the public profile. Uses placeholder logic - the
 * `percent` and `breakdown` come from the page-level computation. A real
 * compatibility scoring lib lives behind a TODO until matching agent A* lands.
 */
export function MatchPercentPanel({
  title,
  subtitle,
  percent,
  breakdown,
}: MatchPercentPanelProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));

  return (
    <section
      className="flex flex-col gap-4 p-5"
      style={{
        background: "var(--surface)",
        borderRadius: "var(--r-card)",
        border: "1px solid var(--line)",
        boxShadow: "var(--shadow-1)",
      }}
    >
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div
            className="mono text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: "var(--ink-muted)" }}
          >
            {title}
          </div>
          <div
            className="display mt-0.5"
            style={{ fontSize: 14, lineHeight: 1.2, color: "var(--ink)" }}
          >
            {subtitle}
          </div>
        </div>
        <div
          className="grid place-items-center"
          style={{
            width: 64,
            height: 64,
            borderRadius: 999,
            background: "var(--field-soft)",
            color: "var(--field)",
            flex: "none",
          }}
          aria-label={`${clamped}% match`}
        >
          <span className="display" style={{ fontSize: 18, lineHeight: 1 }}>
            {clamped}%
          </span>
        </div>
      </header>

      <ul className="flex flex-col gap-2">
        {breakdown.map((row) => {
          const value = Math.max(0, Math.min(100, Math.round(row.value)));
          return (
            <li key={row.label} className="flex items-center gap-3">
              <span
                aria-hidden
                className="grid place-items-center"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 999,
                  background: "var(--accent-tint)",
                  color: "var(--accent-deep)",
                  flex: "none",
                }}
              >
                <Glyph.check size={12} />
              </span>
              <span
                className="flex-1 text-[13px]"
                style={{ color: "var(--ink)" }}
              >
                {row.label}
              </span>
              <div
                aria-hidden
                style={{
                  width: 64,
                  height: 6,
                  borderRadius: 999,
                  background: "var(--surface-2)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${value}%`,
                    height: "100%",
                    background: "var(--accent)",
                  }}
                />
              </div>
              <span
                className="mono w-9 text-right text-[11px]"
                style={{ color: "var(--ink-muted)" }}
              >
                {value}%
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
