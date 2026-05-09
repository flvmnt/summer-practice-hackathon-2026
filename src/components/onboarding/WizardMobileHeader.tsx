import { cn } from "@/lib/utils";

type Props = {
  step: number;
  total: number;
  title: string;
  subtitle?: string;
  stepLabel?: string; // e.g. "Step 1 of 4"
  className?: string;
};

export function WizardMobileHeader({
  step,
  total,
  title,
  subtitle,
  stepLabel,
  className,
}: Props) {
  return (
    <header className={cn("flex flex-col gap-2 px-1", className)}>
      <div className="flex items-center justify-between">
        <span
          className="mono inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{
            background: "var(--accent-tint)",
            color: "var(--accent-deep)",
            borderRadius: 999,
          }}
        >
          {stepLabel ?? `Step ${step} of ${total}`}
        </span>
        <div className="flex items-center gap-1" aria-hidden="true">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              style={{
                width: 16,
                height: 4,
                borderRadius: 2,
                background:
                  i < step ? "var(--accent)" : "var(--line-2)",
                transition: "background var(--t-2) var(--ease)",
              }}
            />
          ))}
        </div>
      </div>
      <h1
        className="display"
        style={{ fontSize: 28, lineHeight: 1.1, color: "var(--ink)" }}
      >
        {title}
      </h1>
      {subtitle ? (
        <p style={{ fontSize: 13, color: "var(--ink-muted)" }}>{subtitle}</p>
      ) : null}
    </header>
  );
}
