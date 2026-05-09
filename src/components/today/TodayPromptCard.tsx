"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { TodayConfirmedCard } from "./TodayConfirmedCard";
import { TodayFoundCard } from "./TodayFoundCard";
import { TodayPromptHero } from "./TodayPromptHero";
import { TodayQueuedCard } from "./TodayQueuedCard";
import { TodaySaidNoCard } from "./TodaySaidNoCard";
import { TodaySearching } from "./TodaySearching";
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
  openGroup: string;
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

type DerivedState = "prompt" | "searching" | "found" | "queued" | "said-no" | "confirmed";

const initialState: TodayPromptFormState = {};

function deriveState({
  pending,
  pendingAnswer,
  formStatus,
  group,
  response,
}: {
  pending: boolean;
  pendingAnswer: "yes" | "no" | null;
  formStatus: TodayPromptFormState["state"] | undefined;
  group: TodayGroup | null;
  response: TodayResponse | null;
}): DerivedState {
  // While the action is in flight after a Yes click → animated funnel.
  if (pending && pendingAnswer === "yes") {
    return "searching";
  }
  if (group) {
    // If we knew an event were confirmed, we'd flip to "confirmed".
    // Wave-1 shape doesn't carry that; A6 / event flow takes over once an
    // event row exists. Treat group-with-no-event as "found".
    return "found";
  }
  if (formStatus === "matched") {
    return "found";
  }
  if (formStatus === "queued") {
    return "queued";
  }
  if (formStatus === "no_match") {
    return "queued";
  }
  if (formStatus === "unavailable") {
    return "said-no";
  }
  if (response?.answer === "no") {
    return "said-no";
  }
  if (response?.answer === "yes" && response?.lastMatchAttemptAt) {
    return "queued";
  }
  if (response?.answer === "yes") {
    return "queued";
  }
  return "prompt";
}

/**
 * Inner consumer of useFormStatus so we can derive the in-flight
 * "searching" state from outside the form children. Renders the
 * full state machine (A–F) within the same form so submissions
 * have access to the hidden inputs.
 */
function TodayBody({
  copy,
  group,
  locale,
  prompt,
  response,
  sports,
  formStatus,
  formError,
  windowLabel,
  weatherLabel,
  nearbyLabel,
}: {
  copy: TodayPromptCopy;
  group: TodayGroup | null;
  locale: string;
  prompt: TodayPrompt;
  response: TodayResponse | null;
  sports: Array<{ sport: SportKey; level: number }>;
  formStatus: TodayPromptFormState["state"] | undefined;
  formError?: string;
  windowLabel: string;
  weatherLabel: string;
  nearbyLabel: string;
}) {
  const status = useFormStatus();
  const pendingAnswer = status.pending
    ? status.data?.get("answer") === "yes"
      ? "yes"
      : status.data?.get("answer") === "no"
        ? "no"
        : null
    : null;

  const state = deriveState({
    pending: status.pending,
    pendingAnswer,
    formStatus,
    group,
    response,
  });

  const primarySport = sports[0]?.sport;
  const sportLabel = group ? copy.sports[group.sport] : primarySport ? copy.sports[primarySport] : "";
  const headline = prompt.messageText ?? "ShowUpToday?";

  // The submit buttons must remain mounted inside the form during pending →
  // useFormStatus only works while children render. We always render the
  // hidden inputs so the action sees them, then render the right hero.
  return (
    <>
      <input name="promptId" type="hidden" value={prompt.id} />
      <input
        name="maxDistanceKm"
        type="hidden"
        value={response?.maxDistanceKm ?? 5}
      />
      {sports.map((entry) => (
        <input
          key={entry.sport}
          name="sportPrefs"
          type="hidden"
          value={entry.sport}
        />
      ))}

      {state === "prompt" ? (
        <TodayPromptHero
          headline={headline}
          subhead={`${sports.map((s) => copy.sports[s.sport]).slice(0, 2).join(", ")}${
            sports.length > 2 ? ` and ${sports.length - 2} more` : ""
          } nearby today.`}
          primarySport={primarySport}
          yesLabel={copy.yes}
          noLabel={copy.no}
          windowLabel={windowLabel}
          weatherLabel={weatherLabel}
          nearbyLabel={nearbyLabel}
        />
      ) : null}

      {state === "searching" ? (
        <TodaySearching
          headline="Matching you…"
          matchingLabel="Matching"
          ranges={[
            {
              count: 8,
              label: `nearby ${primarySport ? copy.sports[primarySport].toLowerCase() : "sport"} players`,
              delay: 0,
            },
            { count: 6, label: "available now", delay: 800 },
            {
              count: 4,
              label: "high compatibility fits",
              delay: 1600,
              active: true,
            },
          ]}
          aiLabel="AI scoring"
          aiDescription="weighing skill, schedule and proximity"
        />
      ) : null}

      {state === "found" && group ? (
        <TodayFoundCard
          groupId={group.id}
          sport={group.sport}
          sportLabel={sportLabel}
          captainName={null}
          groupSize={null}
          locale={locale}
          inLabel={`You're in · ${sportLabel}`}
          openLabel={copy.openGroup}
          confirmLabel="Confirm participation"
          whyLabel="Why this group?"
          venueName="Suggested venue nearby"
          venueSub="Captain will lock the spot · ~2 km"
          matchScore={92}
        />
      ) : null}

      {state === "queued" ? (
        <TodayQueuedCard
          sportLabel={sportLabel || "your sport"}
          bodyText={copy.queuedBody}
          elapsedLabel="just now"
          planBLabel="Plan B"
          planBLinks={[
            { label: "Try a nearby run instead", href: `/${locale}/today` },
            { label: "Create a small manual event", href: `/${locale}/events/new` },
          ]}
          primarySport={primarySport}
        />
      ) : null}

      {state === "said-no" ? (
        <TodaySaidNoCard
          title="Rest day logged."
          body={copy.unavailableBody}
          changeLabel="Change to Yes"
        />
      ) : null}

      {state === "confirmed" && group ? (
        <TodayConfirmedCard
          groupId={group.id}
          locale={locale}
          startsLabel="Starts soon"
          whenLabel={`${sportLabel} · 18:30`}
          venueName="Baza 2"
          venueSub="Tineretului · 2.1 km"
          chatLabel="Open chat"
          calendarLabel="Add to calendar"
        />
      ) : null}

      {formError ? (
        <p
          className="mt-4 rounded-md border px-3 py-2 text-sm font-semibold"
          style={{
            background: "var(--alert-soft)",
            color: "var(--alert)",
            borderColor: "var(--alert)",
          }}
          role="alert"
        >
          {copy.genericError}
        </p>
      ) : null}
    </>
  );
}

export function TodayPromptCard({
  copy,
  group,
  locale,
  maxDistanceKm,
  prompt,
  response,
  sports,
}: {
  copy: TodayPromptCopy;
  group: TodayGroup | null;
  locale: string;
  maxDistanceKm: number;
  prompt: TodayPrompt;
  response: TodayResponse | null;
  sports: Array<{ sport: SportKey; level: number }>;
}) {
  const [formState, formAction] = useActionState(
    todayPromptFormAction,
    initialState,
  );
  const currentGroup = formState.group ?? group;
  const currentResponse: TodayResponse | null = formState.answer
    ? {
        answer: formState.answer,
        sportPrefs: sports.map((s) => s.sport),
        maxDistanceKm,
        matchFailureReason: null,
        lastMatchAttemptAt: new Date(),
      }
    : response;

  const windowLabel = "Live · today";
  const weatherLabel = "Clear, 18°C";
  const nearbyLabel = "playing today";

  return (
    <form action={formAction} className="contents">
      <TodayBody
        copy={copy}
        group={currentGroup}
        locale={locale}
        prompt={prompt}
        response={currentResponse}
        sports={sports}
        formStatus={formState.state}
        formError={formState.error}
        windowLabel={windowLabel}
        weatherLabel={weatherLabel}
        nearbyLabel={nearbyLabel}
      />
    </form>
  );
}
