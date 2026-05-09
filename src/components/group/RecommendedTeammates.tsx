"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Glyph } from "@/components/ui/Glyph";
import { Pill } from "@/components/ui/Pill";
import type { RecommendationCandidate } from "@/lib/recommendations";
import { inviteRecommendedAction } from "@/lib/recommendation-actions";

export type RecommendedTeammatesCopy = {
  title: string;
  subtitle: string;
  captainOnly: string;
  noResults: string;
  matchPercent: string;
  distanceLabel: string;
  sameCity: string;
  explainAi: string;
  explainFallback: string;
  invite: string;
  inviting: string;
  invited: string;
  errors: {
    unauthorized: string;
    conflict: string;
    notFound: string;
    generic: string;
  };
};

type Status = "idle" | "pending" | "invited" | "error";

type RowState = {
  status: Status;
  errorKey?: keyof RecommendedTeammatesCopy["errors"];
};

type Props = {
  groupId: string;
  candidates: RecommendationCandidate[];
  copy: RecommendedTeammatesCopy;
};

function formatDistance(distanceKm: number, copy: RecommendedTeammatesCopy) {
  if (distanceKm < 0.5) return copy.sameCity;
  return copy.distanceLabel.replace("{km}", distanceKm.toFixed(1));
}

function errorKeyForResult(error: string): keyof RecommendedTeammatesCopy["errors"] {
  if (error === "unauthorized") return "unauthorized";
  if (error === "conflict") return "conflict";
  if (error === "not_found") return "notFound";
  return "generic";
}

export function RecommendedTeammates({ groupId, candidates, copy }: Props) {
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});
  const [, startTransition] = useTransition();

  const handleInvite = (userId: string) => {
    setRowStates((prev) => ({ ...prev, [userId]: { status: "pending" } }));
    startTransition(async () => {
      try {
        const result = await inviteRecommendedAction({ groupId, userId });
        if (result.ok) {
          setRowStates((prev) => ({
            ...prev,
            [userId]: { status: "invited" },
          }));
          return;
        }
        setRowStates((prev) => ({
          ...prev,
          [userId]: { status: "error", errorKey: errorKeyForResult(result.error) },
        }));
      } catch {
        setRowStates((prev) => ({
          ...prev,
          [userId]: { status: "error", errorKey: "generic" },
        }));
      }
    });
  };

  return (
    <Card variant="card" className="flex flex-col gap-3 p-4">
      <header className="flex items-center gap-2">
        <span
          aria-hidden
          className="grid h-7 w-7 place-items-center"
          style={{
            background: "var(--accent-soft)",
            color: "var(--accent-deep)",
            borderRadius: 8,
          }}
        >
          <Glyph.spark size={16} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <h2
            className="display"
            style={{ fontSize: 16, lineHeight: 1.15, color: "var(--ink)" }}
          >
            {copy.title}
          </h2>
          <p
            className="text-[12px] leading-snug"
            style={{ color: "var(--ink-muted)" }}
          >
            {copy.subtitle}
          </p>
        </div>
        <Pill variant="alt">{copy.captainOnly}</Pill>
      </header>

      {candidates.length === 0 ? (
        <p
          className="text-[13px] leading-snug"
          style={{ color: "var(--ink-muted)" }}
        >
          {copy.noResults}
        </p>
      ) : (
        <ul className="flex flex-col gap-2" aria-label={copy.title}>
          {candidates.map((candidate) => {
            const state = rowStates[candidate.userId] ?? { status: "idle" };
            const errorMessage =
              state.status === "error" && state.errorKey
                ? copy.errors[state.errorKey]
                : null;
            return (
              <li
                key={candidate.userId}
                className="flex flex-col gap-2 rounded-[12px] px-3 py-3"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--line)",
                }}
              >
                <div className="flex items-start gap-2">
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p
                      className="truncate text-[14px] font-semibold"
                      style={{ color: "var(--ink)" }}
                    >
                      {candidate.fullName}
                    </p>
                    <p
                      className="mono text-[10px] font-bold uppercase tracking-[0.12em]"
                      style={{ color: "var(--ink-muted)" }}
                    >
                      @{candidate.username}
                    </p>
                  </div>
                  <Pill variant="accent">
                    {copy.matchPercent.replace("{score}", String(candidate.score))}
                  </Pill>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <Pill variant="field" icon={<Glyph.pin size={12} />}>
                    {formatDistance(candidate.distanceKm, copy)}
                  </Pill>
                  <Pill variant="alt">
                    {candidate.source === "ai" ? copy.explainAi : copy.explainFallback}
                  </Pill>
                </div>

                {candidate.reason ? (
                  <p
                    className="text-[12px] leading-snug"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    {candidate.reason}
                  </p>
                ) : null}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleInvite(candidate.userId)}
                    disabled={state.status === "pending" || state.status === "invited"}
                    aria-busy={state.status === "pending" || undefined}
                    className="btn-s2m"
                    style={{
                      minHeight: 40,
                      fontSize: 13,
                      padding: "8px 14px",
                      opacity:
                        state.status === "pending" || state.status === "invited"
                          ? 0.7
                          : 1,
                    }}
                  >
                    {state.status === "invited" ? (
                      <>
                        <Glyph.check size={14} />
                        {copy.invited}
                      </>
                    ) : state.status === "pending" ? (
                      copy.inviting
                    ) : (
                      <>
                        <Glyph.plus size={14} />
                        {copy.invite}
                      </>
                    )}
                  </button>
                  {errorMessage ? (
                    <p
                      role="alert"
                      className="text-[12px] font-semibold"
                      style={{ color: "var(--alert)" }}
                    >
                      {errorMessage}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
