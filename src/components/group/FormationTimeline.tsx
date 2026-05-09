"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Glyph } from "@/components/ui/Glyph";
import { AIMark } from "@/components/ui/AIMark";
import { cn } from "@/lib/utils";

export type FormationReason = {
  icon?: ReactNode;
  label: string;
  value?: string;
};

type Props = {
  reasons: ReadonlyArray<FormationReason>;
  score?: number;
  defaultOpen?: boolean;
  title?: string;
  className?: string;
};

type StepState = "done" | "active" | "pending";

/**
 * "Why this group?" expandable panel.
 * Renders the formation steps as a vertical timeline on mobile and a
 * horizontal rail on tablet+. Each step has an explicit pending /
 * active / done state derived from the presence of `reason.value`:
 *
 * - reason has `value` => the gate has cleared (done)
 * - first reason without `value` => currently being evaluated (active)
 * - remaining reasons => pending
 *
 * If `reasons` is empty, an empty state is rendered with copy
 * encouraging the user to wait for the first signal.
 */
export function FormationTimeline({
  reasons,
  score,
  defaultOpen = false,
  title,
  className,
}: Props) {
  const id = useId();
  const t = useTranslations("formationTimeline");
  const locale = useLocale();
  const [open, setOpen] = useState(defaultOpen);

  const heading = title ?? t("title");

  const stepStates: StepState[] = useMemo(() => {
    const activeIndex = reasons.findIndex(
      (reason) => reason.value === undefined || reason.value === "",
    );
    return reasons.map((_, index) => {
      if (activeIndex === -1 || index < activeIndex) return "done";
      if (index === activeIndex) return "active";
      return "pending";
    });
  }, [reasons]);

  const completedCount = stepStates.filter((s) => s === "done").length;
  const totalCount = stepStates.length;

  const checkedAtLabel = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      return new Intl.DateTimeFormat(locale === "ro" ? "ro-RO" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date());
    } catch {
      return null;
    }
  }, [locale]);

  const stateStyles: Record<
    StepState,
    {
      bullet: { background: string; color: string; border: string };
      label: string;
      rail: string;
    }
  > = {
    done: {
      bullet: {
        background: "var(--accent)",
        color: "var(--on-accent)",
        border: "1px solid var(--accent)",
      },
      label: "var(--ink)",
      rail: "var(--accent)",
    },
    active: {
      bullet: {
        background: "var(--accent-soft)",
        color: "var(--accent-deep)",
        border: "1.5px solid var(--accent)",
      },
      label: "var(--ink)",
      rail: "var(--line-2)",
    },
    pending: {
      bullet: {
        background: "var(--surface)",
        color: "var(--ink-muted)",
        border: "1px dashed var(--line-2)",
      },
      label: "var(--ink-muted)",
      rail: "var(--line)",
    },
  };

  return (
    <div
      className={cn("w-full", className)}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-card)",
        padding: 14,
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 border-0 bg-transparent text-left"
        style={{
          color: "var(--ink-muted)",
          fontSize: 13,
          minHeight: 44,
          padding: "4px 0",
        }}
      >
        <AIMark className="text-[var(--accent)]" />
        <span className="flex-1" style={{ fontWeight: 600, color: "var(--ink)" }}>
          {heading}
        </span>
        {totalCount > 0 ? (
          <span
            className="mono"
            aria-label={t("progressLabel", {
              done: completedCount,
              total: totalCount,
            })}
            style={{
              color: "var(--ink-muted)",
              fontSize: 11,
              padding: "2px 8px",
              borderRadius: "var(--r-pill)",
              background: "var(--accent-tint)",
            }}
          >
            {completedCount}/{totalCount}
          </span>
        ) : null}
        {typeof score === "number" ? (
          <span
            className="mono"
            style={{ color: "var(--ink)", fontSize: 12 }}
            aria-label={t("scoreLabel", { score })}
          >
            {score}
          </span>
        ) : null}
        <span
          aria-hidden
          style={{
            display: "inline-flex",
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform var(--t-2) var(--ease)",
            color: "var(--ink-muted)",
          }}
        >
          <Glyph.chevron size={14} />
        </span>
      </button>

      {open ? (
        <div
          id={`${id}-panel`}
          className="mt-3"
          style={{
            background: "var(--accent-tint)",
            borderRadius: "var(--r-card)",
            padding: 14,
          }}
        >
          {totalCount === 0 ? (
            <div
              role="status"
              className="flex flex-col items-start gap-2"
              style={{ minHeight: 64, padding: "4px 0" }}
            >
              <span
                aria-hidden
                className="grid place-items-center"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "var(--r-chip)",
                  background: "var(--surface)",
                  color: "var(--accent-deep)",
                }}
              >
                <Glyph.clock size={14} />
              </span>
              <p
                style={{
                  color: "var(--ink)",
                  fontSize: 13,
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                {t("empty.title")}
              </p>
              <p
                style={{
                  color: "var(--ink-muted)",
                  fontSize: 12,
                  margin: 0,
                  lineHeight: 1.4,
                }}
              >
                {t("empty.body")}
              </p>
            </div>
          ) : (
            <ol
              className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3"
              style={{ margin: 0, padding: 0, listStyle: "none" }}
            >
              {reasons.map((r, i) => {
                const state = stepStates[i];
                const styles = stateStyles[state];
                const isLast = i === reasons.length - 1;
                const stateLabel = t(`state.${state}`);
                return (
                  <li
                    key={i}
                    className="relative flex items-start gap-2 sm:flex-1 sm:basis-[140px] sm:flex-col sm:items-start"
                    style={{ minHeight: 44 }}
                  >
                    {!isLast ? (
                      <span
                        aria-hidden
                        className="absolute left-[13px] top-7 h-[calc(100%-4px)] w-px sm:hidden"
                        style={{ background: styles.rail }}
                      />
                    ) : null}
                    {!isLast ? (
                      <span
                        aria-hidden
                        className="absolute left-[28px] top-[13px] hidden h-px w-[calc(100%-32px)] sm:block"
                        style={{ background: styles.rail }}
                      />
                    ) : null}

                    <span
                      aria-hidden
                      className="grid place-items-center"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "var(--r-pill)",
                        flex: "none",
                        ...styles.bullet,
                      }}
                    >
                      {state === "done" ? (
                        <Glyph.check size={14} />
                      ) : state === "active" ? (
                        <span
                          className="grid place-items-center"
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "var(--r-pill)",
                            background: "var(--accent)",
                          }}
                        />
                      ) : (
                        (r.icon ?? <Glyph.clock size={12} />)
                      )}
                    </span>

                    <span className="flex min-w-0 flex-1 flex-col gap-0.5 sm:mt-1">
                      <span
                        className="mono"
                        aria-hidden
                        style={{
                          fontSize: 10,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color:
                            state === "active"
                              ? "var(--accent-deep)"
                              : "var(--ink-muted)",
                        }}
                      >
                        {stateLabel}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: state === "pending" ? 500 : 600,
                          color: styles.label,
                          lineHeight: 1.3,
                        }}
                      >
                        <span className="sr-only">{stateLabel}: </span>
                        {r.label}
                      </span>
                      {r.value ? (
                        <span
                          className="mono"
                          style={{
                            color: "var(--ink-muted)",
                            fontSize: 11,
                          }}
                        >
                          {r.value}
                        </span>
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}

          {checkedAtLabel && totalCount > 0 ? (
            <p
              className="mono"
              style={{
                marginTop: 10,
                fontSize: 10,
                color: "var(--ink-muted)",
                letterSpacing: "0.04em",
              }}
            >
              {t("updatedAt", { time: checkedAtLabel })}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
