import Link from "next/link";

type Props = {
  complete: number;
  total: number;
  nextLabel: string;
  nextHref: string;
  className?: string;
};

export function SetupBanner({
  complete,
  total,
  nextLabel,
  nextHref,
  className,
}: Props) {
  const pct =
    total > 0 ? Math.min(100, Math.max(0, (complete / total) * 100)) : 0;
  return (
    <aside
      className={className}
      aria-label="Profile setup progress"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-card)",
        padding: "12px 14px",
        boxShadow: "var(--shadow-1)",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div
            className="mono text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: "var(--accent-deep)" }}
          >
            {complete}/{total} setup complete
          </div>
          <div
            className="mt-1 truncate text-[13px] font-semibold"
            style={{ color: "var(--ink)" }}
          >
            Next: {nextLabel}
          </div>
        </div>
        <Link
          href={nextHref}
          className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-[12px] font-semibold"
          style={{
            background: "var(--accent-soft)",
            color: "var(--accent-deep)",
            minHeight: 36,
          }}
        >
          Continue setup
        </Link>
      </div>
      <div
        aria-hidden
        className="mt-3 h-1 w-full overflow-hidden rounded-full"
        style={{ background: "var(--line)" }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: "var(--accent)",
            transition: "width var(--t-3) var(--ease)",
          }}
        />
      </div>
    </aside>
  );
}
