import { Glyph } from "@/components/ui/Glyph";
import { Pill } from "@/components/ui/Pill";
import { AIMark } from "@/components/ui/AIMark";
import { RatchetRow } from "./RatchetRow";

type Range = {
  count: number;
  label: string;
  delay?: number;
  active?: boolean;
};

type Props = {
  ranges?: ReadonlyArray<Range>;
  matchingLabel?: string;
  headline?: string;
  elapsed?: string;
  aiLabel?: string;
  aiDescription?: string;
  className?: string;
};

const DEFAULT_RANGES: ReadonlyArray<Range> = [
  { count: 8, label: "nearby football players", delay: 0 },
  { count: 6, label: "available now", delay: 600 },
  { count: 4, label: "high compatibility fits", delay: 1300, active: true },
];

/**
 * Helper card showing the matching funnel.
 * Ported from screens.jsx TodaySearching.
 */
export function TodaySearching({
  ranges = DEFAULT_RANGES,
  matchingLabel = "Matching",
  headline = "Finding your group",
  elapsed = "00:18",
  aiLabel = "AI scoring",
  aiDescription = "weighing skill, schedule and proximity",
  className,
}: Props) {
  const icons = [
    <Glyph.groups key="g" size={18} />,
    <Glyph.clock key="c" size={18} />,
    <Glyph.spark key="s" size={18} />,
  ];
  return (
    <div
      className={className}
      style={{
        background: "var(--surface)",
        borderRadius: "var(--r-surface)",
        padding: "26px 24px",
        boxShadow: "var(--shadow-3)",
        border: "1px solid var(--line)",
      }}
    >
      <div className="flex items-center justify-between">
        <Pill variant="live">
          <span style={{ fontWeight: 700 }}>{matchingLabel}</span>
        </Pill>
        <span
          className="mono text-[11px]"
          style={{ color: "var(--ink-muted)" }}
        >
          {elapsed}
        </span>
      </div>
      <div
        className="display"
        style={{ fontSize: 32, marginTop: 18, lineHeight: 1.05 }}
      >
        {headline}
        <span className="typing" aria-hidden />
      </div>
      <div className="mt-5 grid gap-2.5">
        {ranges.map((r, i) => (
          <RatchetRow
            key={i}
            icon={icons[Math.min(i, icons.length - 1)]}
            count={r.count}
            label={r.label}
            delay={r.delay ?? 0}
            active={r.active}
          />
        ))}
      </div>
      <div
        className="mt-4 flex items-start gap-2.5 px-3.5 py-3"
        style={{ background: "var(--accent-tint)", borderRadius: 12 }}
      >
        <AIMark className="mt-1 text-[var(--accent)]" />
        <div className="text-[13px]" style={{ lineHeight: 1.4 }}>
          <strong>{aiLabel}</strong> · {aiDescription}
        </div>
      </div>
    </div>
  );
}
