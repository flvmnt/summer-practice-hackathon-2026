"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Glyph } from "@/components/ui/Glyph";
import { IconButton } from "@/components/ui/IconButton";
import { Pill } from "@/components/ui/Pill";
import { ToastProvider } from "@/components/ui/Toast";
import { HeaderBell } from "@/components/layout/HeaderBell";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import {
  CaptainAutoEventReveal,
  type CaptainAutoEventRevealCopy,
} from "@/components/event/CaptainAutoEventReveal";
import {
  CaptainBriefPanel,
  type CaptainBriefPanelCopy,
} from "@/components/event/CaptainBriefPanel";
import { EventChatForm } from "@/components/event/EventChatForm";
import {
  EventDetailsPanel,
  type EventDetailsCopy,
} from "@/components/event/EventDetailsPanel";
import { EventTabs } from "@/components/event/EventTabs";
import { VoteCard } from "@/components/event/VoteCard";
import type { RsvpStatus } from "@/components/event/RsvpButtons";
import type { CaptainBrief } from "@/lib/ai/captain-brief";
import type { SportKey } from "@/lib/sports";

export type EventScreenCopy = {
  back: string;
  tabs: { details: string; chat: string; vote: string };
  details: EventDetailsCopy;
  chat: {
    title: string;
    empty: string;
    system: string;
    form: {
      messagePlaceholder: string;
      send: string;
      sending: string;
      genericError: string;
    };
  };
  vote: {
    title: string;
    closeVote: string;
    closedNotice: string;
  };
  captainReveal: CaptainAutoEventRevealCopy;
  captainBrief: CaptainBriefPanelCopy;
  status: { proposed: string; confirmed: string; cancelled: string };
};

type Message = {
  id: string;
  body: string;
  createdAt: string;
  user: { id: string; fullName: string } | null;
};

type VenueOption = {
  optionIdx: number;
  venueId: string;
  name: string;
  votes: number;
};

type Props = {
  copy: EventScreenCopy;
  locale: "ro" | "en";
  groupHref: string;
  currentUserId: string;
  isCaptain: boolean;
  event: {
    id: string;
    sport: SportKey;
    status: string;
    whenAt: string;
    durationMin: number;
  };
  venue: {
    name: string;
    lat: number | null;
    lng: number | null;
    distanceKm: string | null;
    priceTier: string;
    fit: "outdoor_good" | "indoor_recommended" | "wind_warning" | "cold_warning";
  } | null;
  weather: {
    fit: "outdoor_good" | "indoor_recommended" | "wind_warning" | "cold_warning";
    temperatureC: number;
    rainProbability: number;
    windKmh: number;
  } | null;
  initialRsvp: RsvpStatus;
  messages: Message[];
  venueOptions: VenueOption[];
  totalAttendees: number;
  myVoteOptionIdx: number | null;
  voteOpen: boolean;
  captainBrief: { brief: CaptainBrief; source: "ai" | "fallback" } | null;
};

export function EventScreen(props: Props) {
  return (
    <ToastProvider>
      <EventScreenInner {...props} />
    </ToastProvider>
  );
}

function EventScreenInner({
  copy,
  locale,
  groupHref,
  currentUserId,
  isCaptain,
  event,
  venue,
  weather,
  initialRsvp,
  messages,
  venueOptions,
  totalAttendees,
  myVoteOptionIdx,
  voteOpen,
  captainBrief,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const switchTo = useCallback(
    (tab: "details" | "chat" | "vote") => {
      const params = new URLSearchParams(
        searchParams ? Array.from(searchParams.entries()) : [],
      );
      if (tab === "details") {
        params.delete("tab");
      } else {
        params.set("tab", tab);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const statusLabel =
    event.status === "confirmed"
      ? copy.status.confirmed
      : event.status === "cancelled"
        ? copy.status.cancelled
        : copy.status.proposed;

  const detailsPanel = (
    <div className="grid gap-4">
      {captainBrief ? (
        <CaptainBriefPanel
          copy={copy.captainBrief}
          brief={captainBrief.brief}
          source={captainBrief.source}
        />
      ) : null}
      <EventDetailsPanel
        copy={copy.details}
        event={{
          id: event.id,
          sport: event.sport,
          whenAt: event.whenAt,
          durationMin: event.durationMin,
        }}
        venue={
          venue
            ? {
                name: venue.name,
                lat: venue.lat,
                lng: venue.lng,
                distanceKm: venue.distanceKm,
                priceTier: venue.priceTier,
              }
            : null
        }
        weather={weather}
        initialRsvp={initialRsvp}
      />
    </div>
  );

  const chatPanel = (
    <div
      className="flex flex-col"
      style={{
        background: "var(--bg-alt)",
        borderRadius: 14,
        border: "1px solid var(--line)",
        overflow: "hidden",
        minHeight: 360,
      }}
    >
      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}
      >
        {messages.length === 0 ? (
          <p
            className="self-center text-center text-[13px]"
            style={{ color: "var(--ink-muted)", padding: "32px 12px" }}
          >
            {copy.chat.empty}
          </p>
        ) : (
          messages.map((m) => {
            const isMine = m.user?.id === currentUserId;
            const name = m.user?.fullName ?? copy.chat.system;
            return (
              <div
                key={m.id}
                style={{
                  alignSelf: isMine ? "flex-end" : "flex-start",
                  maxWidth: "78%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isMine ? "flex-end" : "flex-start",
                  gap: 4,
                }}
              >
                {!isMine ? (
                  <span
                    className="text-[11px]"
                    style={{ color: "var(--ink-muted)", marginLeft: 4 }}
                  >
                    {name}
                  </span>
                ) : null}
                <div
                  style={{
                    padding: "10px 14px",
                    background: isMine ? "var(--accent)" : "var(--surface)",
                    color: isMine ? "var(--on-accent)" : "var(--ink)",
                    borderRadius: 16,
                    borderTopLeftRadius: isMine ? 16 : 4,
                    borderTopRightRadius: isMine ? 4 : 16,
                    fontSize: 14,
                    lineHeight: 1.35,
                    boxShadow: isMine ? "none" : "var(--shadow-1)",
                  }}
                >
                  {m.body}
                </div>
              </div>
            );
          })
        )}
      </div>
      <EventChatForm copy={copy.chat.form} eventId={event.id} />
    </div>
  );

  const votePanel = (
    <div className="grid gap-3">
      <VoteCard
        title={copy.vote.title}
        options={venueOptions.map((o) => ({
          id: String(o.optionIdx),
          label: o.name,
          votes: o.votes,
        }))}
        total={totalAttendees}
        myVote={myVoteOptionIdx === null ? null : String(myVoteOptionIdx)}
        canClose={isCaptain && voteOpen}
        onClose={() => {
          // Close-vote backend lives in votes.ts; this surface just emits the
          // intent. The events lib agent is wiring the close path.
        }}
        disabled={!voteOpen}
      />
      {!voteOpen ? (
        <p
          className="text-[12px]"
          style={{ color: "var(--ink-muted)" }}
        >
          {copy.vote.closedNotice}
        </p>
      ) : null}
    </div>
  );

  return (
    <main
      className="mx-auto w-full"
      style={{
        maxWidth: 1120,
        paddingBottom: 92, // mobile tab bar height + safe area
      }}
    >
      {/* Sticky header card */}
      <header
        className="sticky top-0 z-10"
        style={{
          background: "color-mix(in oklch, var(--bg) 92%, transparent)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          padding: "12px 16px 10px",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div className="flex items-center gap-2">
          <IconButton
            ariaLabel={copy.back}
            onClick={() => router.push(groupHref)}
          >
            <Glyph.back size={20} />
          </IconButton>
          <div className="min-w-0 flex-1">
            <h1
              className="truncate text-[15px] font-bold"
              style={{ color: "var(--ink)", lineHeight: 1.15 }}
            >
              {copy.details.sportLabel}
            </h1>
            <p
              className="mono mt-0.5 truncate text-[11px]"
              style={{ color: "var(--ink-muted)" }}
            >
              {copy.details.whenLabel}
              {venue ? ` · ${venue.name}` : ""}
            </p>
          </div>
          <Pill
            variant={
              event.status === "confirmed"
                ? "field"
                : event.status === "cancelled"
                  ? "alt"
                  : "accent"
            }
          >
            {statusLabel}
          </Pill>
          <HeaderBell unreadCount={0} locale={locale} />
        </div>
      </header>

      <div className="mx-auto grid w-full gap-4 px-4 py-4 lg:grid-cols-[0.85fr_1.2fr_0.95fr]">
        {/* Mobile: tabs. Desktop: 3-col with tabs hidden, all panels visible. */}
        <div className="lg:hidden">
          <EventTabs
            copy={copy.tabs}
            details={<div className="pt-4">{detailsPanel}</div>}
            chat={<div className="pt-4">{chatPanel}</div>}
            vote={<div className="pt-4">{votePanel}</div>}
          />
        </div>

        <section className="hidden lg:block">{detailsPanel}</section>
        <section className="hidden lg:flex lg:flex-col">{chatPanel}</section>
        <section className="hidden lg:block">{votePanel}</section>
      </div>

      {/* Captain auto-event reveal — rendered everywhere; gates itself by
          status + role. */}
      <CaptainAutoEventReveal
        copy={copy.captainReveal}
        isCaptain={isCaptain}
        status={event.status}
        eventId={event.id}
        primaryVenue={
          venue ? { name: venue.name, fit: venue.fit } : null
        }
        onStartVote={() => switchTo("vote")}
      />

      <MobileTabBar />
    </main>
  );
}
