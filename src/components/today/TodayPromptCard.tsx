"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
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

type FoundCopy = {
  in: string;
  groupHeadline: string;
  memberCount: string;
  captainLine: string;
  noCaptainLine: string;
  confirm: string;
  confirming: string;
  why: string;
  venueName: string;
  venueSub: string;
  errorBody: string;
};

type QueuedCopy = {
  title: string;
  subhead: string;
  lookingFor: string;
  searchingLabel: string;
  elapsedJustNow: string;
  elapsedSeconds: string;
  elapsedMinutes: string;
  progressNearby: string;
  progressSkill: string;
  progressFinal: string;
  planB: string;
  planBHint: string;
  tryRun: string;
  createSmall: string;
};

type SaidNoCopy = {
  title: string;
  subhead: string;
  change: string;
  browseHint: string;
};

type ConfirmedCopy = {
  label: string;
  startsLabel: string;
  headline: string;
  venueLine: string;
  rosterLine: string;
  openChat: string;
  calendar: string;
  calendarPending: string;
};

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
  /** Optional richer copy for the polished cards. Falls back to legacy keys. */
  found?: FoundCopy;
  queued?: QueuedCopy;
  saidNo?: SaidNoCopy;
  confirmed?: ConfirmedCopy;
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
  if (pending && pendingAnswer === "yes") {
    return "searching";
  }
  if (group) {
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
 * Format a relative elapsed time using Intl.RelativeTimeFormat so RO/EN
 * pluralization stays consistent with the rest of the app. Falls back to
 * the localized "just now" string when the gap is < 5s.
 */
function formatElapsed(
  fromMs: number | null,
  copy: QueuedCopy | undefined,
  locale: string,
  nowMs: number,
): string {
  if (!copy) return "";
  if (fromMs == null) return copy.elapsedJustNow;
  const deltaMs = Math.max(0, nowMs - fromMs);
  const seconds = Math.floor(deltaMs / 1000);
  if (seconds < 5) return copy.elapsedJustNow;
  if (seconds < 60) {
    return copy.elapsedSeconds.replace("{count}", String(seconds));
  }
  const minutes = Math.floor(seconds / 60);
  // Use Intl for the count to honour locale digit shapes if any.
  const count = new Intl.NumberFormat(locale).format(minutes);
  return copy.elapsedMinutes.replace("{count}", count);
}

/**
 * Locale-aware "starts at HH:mm" using Intl.DateTimeFormat. Returns the
 * raw time string only - the parent template combines it via copy keys.
 */
function formatStartTime(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale === "ro" ? "ro-RO" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function TodayBody({
  copy,
  group,
  locale,
  prompt,
  response,
  sports,
  formStatus,
  formError,
  promptHeadline,
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
  promptHeadline: string;
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
  const headline = promptHeadline || prompt.messageText || "ShowUpToday?";

  // Locale-aware elapsed for the queued card.
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, []);
  const queuedSinceMs =
    response?.lastMatchAttemptAt instanceof Date
      ? response.lastMatchAttemptAt.getTime()
      : null;
  const elapsedLabel = formatElapsed(queuedSinceMs, copy.queued, locale, now);

  // Locale-aware fixed start time for the confirmed card placeholder.
  const startTime = useMemo(() => {
    const today = new Date();
    today.setHours(18, 30, 0, 0);
    return formatStartTime(today, locale);
  }, [locale]);

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
          aiLabel="Rule scoring"
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
          inLabel={copy.found?.in ?? `You're in · ${sportLabel}`}
          groupHeadline={
            copy.found?.groupHeadline.replace("{sport}", sportLabel) ??
            sportLabel
          }
          memberCountLabel={
            copy.found?.memberCount
              .replace("{current}", "10")
              .replace("{ideal}", "12") ?? null
          }
          captainLine={copy.found?.noCaptainLine ?? null}
          openLabel={copy.openGroup}
          confirmLabel={copy.found?.confirm ?? "Confirm participation"}
          whyLabel={copy.found?.why ?? "Why this group?"}
          venueName={copy.found?.venueName ?? "Suggested venue nearby"}
          venueSub={
            copy.found?.venueSub ?? "Captain will lock the spot · ~2 km"
          }
          matchScore={92}
        />
      ) : null}

      {state === "queued" ? (
        <TodayQueuedCard
          title={copy.queued?.title ?? copy.queuedTitle}
          subhead={copy.queued?.subhead ?? copy.queuedBody}
          lookingForLabel={
            copy.queued?.lookingFor.replace(
              "{sport}",
              sportLabel || "your sport",
            ) ?? `Looking for ${sportLabel || "your sport"}`
          }
          elapsedLabel={elapsedLabel}
          searchingLabel={copy.queued?.searchingLabel ?? "Searching"}
          planBLabel={copy.queued?.planB ?? "Plan B"}
          planBHint={
            copy.queued?.planBHint ??
            "While you wait, try one of these:"
          }
          progress={
            copy.queued
              ? [
                  { label: copy.queued.progressNearby, state: "done" },
                  { label: copy.queued.progressSkill, state: "active" },
                  { label: copy.queued.progressFinal, state: "wait" },
                ]
              : undefined
          }
          planBLinks={[
            {
              label: copy.queued?.tryRun ?? "Try a nearby run instead",
              href: `/${locale}/today`,
            },
            {
              label:
                copy.queued?.createSmall ?? "Create a small manual event",
              href: `/${locale}/events/new`,
            },
          ]}
          primarySport={primarySport}
        />
      ) : null}

      {state === "said-no" ? (
        <TodaySaidNoCard
          title={copy.saidNo?.title ?? "Rest day logged."}
          body={copy.saidNo?.subhead ?? copy.unavailableBody}
          changeLabel={copy.saidNo?.change ?? "Change to Yes"}
          browseHint={copy.saidNo?.browseHint}
        />
      ) : null}

      {state === "confirmed" && group ? (
        <TodayConfirmedCard
          groupId={group.id}
          locale={locale}
          confirmedLabel={copy.confirmed?.label ?? "Confirmed for tonight"}
          startsLabel={
            copy.confirmed?.startsLabel.replace("{time}", startTime) ??
            `Starts ${startTime}`
          }
          whenLabel={
            copy.confirmed?.headline
              .replace("{sport}", sportLabel)
              .replace("{time}", startTime) ?? `${sportLabel} · ${startTime}`
          }
          rosterLabel={
            copy.confirmed?.rosterLine
              .replace("{going}", "8")
              .replace("{maybe}", "2") ?? "8 going · 2 maybe"
          }
          venueName="Baza 2"
          venueSub={
            copy.confirmed?.venueLine.replace(
              "{venue}",
              "Tineretului · 2.1 km",
            ) ?? "Tineretului · 2.1 km"
          }
          chatLabel={copy.confirmed?.openChat ?? "Open chat"}
          calendarLabel={copy.confirmed?.calendar ?? "Add to calendar"}
          calendarPendingLabel={copy.confirmed?.calendarPending}
        />
      ) : null}

      {formError ? (
        <p
          className="mt-4 px-3 py-2 text-sm font-semibold"
          style={{
            background: "var(--alert-soft)",
            color: "var(--alert)",
            borderRadius: "var(--r-chip)",
            border: "1px solid var(--alert)",
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
  promptHeadline,
  response,
  sports,
  windowLabel,
  weatherLabel,
  nearbyLabel,
}: {
  copy: TodayPromptCopy;
  group: TodayGroup | null;
  locale: string;
  maxDistanceKm: number;
  prompt: TodayPrompt;
  promptHeadline: string;
  response: TodayResponse | null;
  sports: Array<{ sport: SportKey; level: number }>;
  windowLabel: string;
  weatherLabel: string;
  nearbyLabel: string;
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
        promptHeadline={promptHeadline}
        windowLabel={windowLabel}
        weatherLabel={weatherLabel}
        nearbyLabel={nearbyLabel}
      />
    </form>
  );
}
