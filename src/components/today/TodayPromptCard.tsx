"use client";

import { Check, X } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { todayPromptFormAction, type TodayPromptFormState } from "@/lib/prompt-form-actions";
import type { TodayGroup, TodayPrompt, TodayResponse } from "@/lib/prompt";
import type { SportKey } from "@/lib/sports";

type TodayPromptCopy = {
  promptLabel: string;
  yes: string;
  no: string;
  matchedTitle: string;
  matchedBody: string;
  noMatchTitle: string;
  noMatchBody: string;
  queuedTitle: string;
  queuedBody: string;
  unavailableTitle: string;
  unavailableBody: string;
  genericError: string;
  sportPrefs: string;
  maxDistance: string;
  km: string;
  sports: Record<SportKey, string>;
};

const initialState: TodayPromptFormState = {};

export function TodayPromptCard({
  copy,
  group,
  maxDistanceKm,
  prompt,
  response,
  sports,
}: {
  copy: TodayPromptCopy;
  group: TodayGroup | null;
  maxDistanceKm: number;
  prompt: TodayPrompt;
  response: TodayResponse | null;
  sports: Array<{ sport: SportKey; level: number }>;
}) {
  const [state, formAction] = useActionState(todayPromptFormAction, initialState);
  const currentGroup = state.group ?? group;
  const status =
    state.state ??
    (currentGroup
      ? "matched"
      : response?.answer === "no"
        ? "unavailable"
        : response?.lastMatchAttemptAt
          ? "no_match"
          : response?.answer === "yes"
            ? "queued"
            : undefined);
  const statusCopy = {
    matched: {
      title: copy.matchedTitle,
      body: copy.matchedBody,
    },
    queued: {
      title: copy.queuedTitle,
      body: copy.queuedBody,
    },
    no_match: {
      title: copy.noMatchTitle,
      body: copy.noMatchBody,
    },
    unavailable: {
      title: copy.unavailableTitle,
      body: copy.unavailableBody,
    },
  } as const;

  return (
    <section className="rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-5 shadow-sm sm:p-7">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
        {copy.promptLabel}
      </p>
      <h1 className="mt-3 text-4xl font-bold leading-tight">
        {prompt.messageText}
      </h1>
      <div className="mt-6 grid gap-3 rounded-md bg-[var(--cloud)] p-3">
        <p className="text-sm font-semibold text-[var(--muted)]">{copy.sportPrefs}</p>
        <div className="flex flex-wrap gap-2">
          {sports.map((entry) => (
            <span
              className="rounded-full border border-[var(--line)] bg-white px-3 py-1 text-sm font-semibold"
              key={entry.sport}
            >
              {copy.sports[entry.sport]}
            </span>
          ))}
        </div>
        <p className="text-sm text-[var(--muted)]">
          {copy.maxDistance}: {maxDistanceKm}
          {copy.km}
        </p>
      </div>

      {status ? (
        <div className="mt-6 rounded-md border border-[var(--line)] bg-[var(--mint)] p-4">
          <h2 className="text-lg font-bold">{statusCopy[status].title}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {statusCopy[status].body}
          </p>
          {currentGroup ? (
            <p className="mt-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-[var(--navy)]">
              {copy.sports[currentGroup.sport]}
              {currentGroup.captainUserId ? " - captain selected" : ""}
            </p>
          ) : null}
        </div>
      ) : null}

      {state.error ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-[var(--danger)]">
          {copy.genericError}
        </p>
      ) : null}

      <form action={formAction} className="mt-6 grid gap-3 sm:grid-cols-2">
        <input name="promptId" type="hidden" value={prompt.id} />
        <input name="maxDistanceKm" type="hidden" value={maxDistanceKm} />
        {sports.map((entry) => (
          <input key={entry.sport} name="sportPrefs" type="hidden" value={entry.sport} />
        ))}
        <Button className="min-h-14" name="answer" type="submit" value="yes">
          <Check aria-hidden="true" size={20} />
          {copy.yes}
        </Button>
        <Button className="min-h-14" name="answer" type="submit" value="no" variant="secondary">
          <X aria-hidden="true" size={20} />
          {copy.no}
        </Button>
      </form>
    </section>
  );
}
