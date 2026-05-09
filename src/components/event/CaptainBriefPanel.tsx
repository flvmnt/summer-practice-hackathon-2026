import { AIMark } from "@/components/ui/AIMark";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import type { CaptainBrief } from "@/lib/ai/captain-brief";

export type CaptainBriefPanelCopy = {
  header: string;
  sourceAi: string;
  sourceFallback: string;
  reasonLabel: string;
  decisionsLabel: string;
  decisionLabels: {
    venue: string;
    time: string;
    team: string;
  };
};

type Props = {
  copy: CaptainBriefPanelCopy;
  brief: CaptainBrief;
  source: "ai" | "fallback";
};

/**
 * Server-rendered panel that surfaces the AI captain brief on the event page.
 * Displays summary, reasoning, and up-to-three actionable decisions. Visible
 * to all attendees but framed as "Captain brief" so non-captains read it as
 * informational. Strings come from the parent (i18n at the page boundary).
 */
export function CaptainBriefPanel({ copy, brief, source }: Props) {
  const sourceLabel =
    source === "ai" ? copy.sourceAi : copy.sourceFallback;

  return (
    <Card
      as="section"
      variant="card"
      className="p-4"
      aria-label={copy.header}
    >
      <div className="flex items-center gap-2">
        <Pill variant="accent" icon={<AIMark size={12} />}>
          {copy.header}
        </Pill>
        <span
          className="mono ml-auto text-[10px] uppercase tracking-[0.12em]"
          style={{ color: "var(--ink-muted)" }}
        >
          {sourceLabel}
        </span>
      </div>

      <p
        className="mt-3 text-[14px]"
        style={{ color: "var(--ink)", lineHeight: 1.45 }}
      >
        {brief.summary}
      </p>

      <div className="mt-3">
        <div
          className="mono mb-1 text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: "var(--ink-muted)" }}
        >
          {copy.reasonLabel}
        </div>
        <p
          className="text-[13px]"
          style={{ color: "var(--ink-2)", lineHeight: 1.45 }}
        >
          {brief.reason}
        </p>
      </div>

      {brief.decisions.length > 0 ? (
        <div className="mt-3">
          <div
            className="mono mb-2 text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: "var(--ink-muted)" }}
          >
            {copy.decisionsLabel}
          </div>
          <ul
            className="grid gap-2"
            style={{ listStyle: "none", padding: 0, margin: 0 }}
          >
            {brief.decisions.map((d, i) => (
              <li
                key={`${d.id}-${i}`}
                className="flex items-start gap-2"
                style={{
                  padding: "8px 10px",
                  background: "var(--bg-alt)",
                  border: "1px solid var(--line)",
                  borderRadius: 10,
                }}
              >
                <Pill variant="field">{copy.decisionLabels[d.id]}</Pill>
                <span
                  className="text-[13px]"
                  style={{ color: "var(--ink)", lineHeight: 1.4 }}
                >
                  {d.question}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
