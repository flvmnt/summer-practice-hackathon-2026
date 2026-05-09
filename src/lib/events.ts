"use server";

import { and, asc, desc, eq, gte, inArray, lt } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import {
  eventAttendees,
  eventVenueCandidates,
  events,
  groupMembers,
  groups,
  messages,
  venues,
  voteChoices,
  votes,
} from "@/db/schema";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth-current-user";
import {
  createGroupEventInputSchema,
  type CreateGroupEventInput,
  updateEventRsvpInputSchema,
  type UpdateEventRsvpInput,
} from "@/lib/contracts/event";
import type { SportKey } from "@/lib/sports";

export type CreatedGroupEvent = {
  id: string;
  title: string;
  whenAt: string;
};

export type UserEventsFilter = "upcoming" | "past" | "all";

export type UserEventsListItem = {
  id: string;
  title: string;
  sport: SportKey;
  whenAt: string;
  durationMin: number;
  venueLabel: string | null;
  rsvp: "going" | "maybe" | "declined" | "unknown";
  groupId: string;
  isPast: boolean;
};

export type CaptainGroup = {
  id: string;
  sport: SportKey;
  city: string | null;
  sizeTarget: number;
  status: string;
};

const userEventsFilterSchema = z.enum(["upcoming", "past", "all"]);
const userIdSchema = z.string().uuid();
const LISTABLE_EVENT_STATUSES = ["proposed", "confirmed"] as const;

function defaultEventTime() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setUTCHours(16, 0, 0, 0);
  return date;
}

const SPORT_LABELS: Record<"en" | "ro", Record<SportKey, string>> = {
  en: {
    football: "Football",
    basketball: "Basketball",
    tennis: "Tennis",
    volleyball: "Volleyball",
    badminton: "Badminton",
    running: "Running",
    cycling: "Cycling",
    yoga: "Yoga",
    hiking: "Hiking",
    table_tennis: "Table tennis",
  },
  ro: {
    football: "Fotbal",
    basketball: "Baschet",
    tennis: "Tenis",
    volleyball: "Volei",
    badminton: "Badminton",
    running: "Alergare",
    cycling: "Ciclism",
    yoga: "Yoga",
    hiking: "Drumeție",
    table_tennis: "Tenis de masă",
  },
};

const SEEDED_VENUES: Array<{
  externalId: string;
  name: string;
  address: string;
  lat: string;
  lng: string;
  sports: SportKey[];
  priceTier: "free" | "low" | "medium";
  priceConfidence: "verified" | "estimated";
}> = [
  {
    externalId: "timisoara-roses-park",
    name: "Parcul Rozelor",
    address: "Parcul Rozelor, Timișoara",
    lat: "45.753700",
    lng: "21.230900",
    sports: ["running", "yoga"],
    priceTier: "free",
    priceConfidence: "verified",
  },
  {
    externalId: "timisoara-bega-track",
    name: "Malul Begăi",
    address: "Bega river path, Timișoara",
    lat: "45.748900",
    lng: "21.208700",
    sports: ["running", "cycling"],
    priceTier: "free",
    priceConfidence: "verified",
  },
  {
    externalId: "timisoara-sport-center",
    name: "Baza Sportivă 2",
    address: "Zona Circumvalațiunii, Timișoara",
    lat: "45.764500",
    lng: "21.216100",
    sports: ["football", "basketball", "tennis", "volleyball", "badminton", "table_tennis"],
    priceTier: "medium",
    priceConfidence: "estimated",
  },
  {
    externalId: "timisoara-central-courts",
    name: "Terenuri Centrale",
    address: "Centru, Timișoara",
    lat: "45.756000",
    lng: "21.229000",
    sports: ["tennis", "badminton", "table_tennis"],
    priceTier: "low",
    priceConfidence: "estimated",
  },
  {
    externalId: "timisoara-forest-trail",
    name: "Pădurea Verde",
    address: "Pădurea Verde, Timișoara",
    lat: "45.781400",
    lng: "21.267800",
    sports: ["running", "cycling", "hiking"],
    priceTier: "free",
    priceConfidence: "verified",
  },
];

function eventCopy(locale: "ro" | "en", sport: string) {
  const sportLabel =
    SPORT_LABELS[locale][sport as SportKey] ?? SPORT_LABELS[locale].running;

  if (locale === "ro") {
    return {
      title: `Plan de ${sportLabel}`,
      groupMessage: `Plan de eveniment creat: ${sportLabel}`,
      eventMessage: "Chatul separat de eveniment este deschis pentru acest plan.",
    };
  }

  return {
    title: `${sportLabel} plan`,
    groupMessage: `Event plan created: ${sportLabel}`,
    eventMessage: "Event-specific chat opened for this plan.",
  };
}

function venueReason(locale: "ro" | "en", rank: number) {
  if (locale === "ro") {
    return rank === 1
      ? "Cel mai bun candidat determinist pentru sport și proximitate."
      : "Alternativă apropiată pentru votul grupului.";
  }

  return rank === 1
    ? "Best deterministic candidate for sport and proximity."
    : "Nearby fallback for the group vote.";
}

export async function createGroupEventAction(
  input: CreateGroupEventInput,
): Promise<ActionResult<{ event: CreatedGroupEvent }>> {
  const parsed = createGroupEventInputSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("validation");
  }

  const user = await getCurrentUser();
  if (!user) {
    return actionError("unauthorized");
  }

  const [membership] = await getDb()
    .select({
      groupId: groupMembers.groupId,
      role: groupMembers.role,
      status: groupMembers.status,
      demoRunId: groupMembers.demoRunId,
    })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, parsed.data.groupId),
        eq(groupMembers.userId, user.id),
        eq(groupMembers.status, "confirmed"),
      ),
    )
    .limit(1);

  if (!membership || membership.role !== "captain") {
    return actionError("unauthorized");
  }

  const [group] = await getDb()
    .select({
      id: groups.id,
      sport: groups.sport,
      city: groups.city,
    })
    .from(groups)
    .where(eq(groups.id, parsed.data.groupId))
    .limit(1);

  if (!group) {
    return actionError("not_found");
  }

  const memberRows = await getDb()
    .select({
      userId: groupMembers.userId,
    })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, parsed.data.groupId),
        eq(groupMembers.status, "confirmed"),
      ),
    );

  const whenAt = defaultEventTime();
  const copy = eventCopy(user.locale, group.sport);

  const createdEvent = await getDb().transaction(async (tx) => {
    const [event] = await tx
      .insert(events)
      .values({
        demoRunId: membership.demoRunId,
        groupId: group.id,
        title: copy.title,
        sport: group.sport,
        whenAt,
        durationMin: 90,
        customLocationText: group.city ? `${group.city} venue to be confirmed` : null,
        createdByUserId: user.id,
      })
      .returning({
        id: events.id,
        title: events.title,
        whenAt: events.whenAt,
      });

    if (!event) {
      return null;
    }

    if (memberRows.length > 0) {
      await tx.insert(eventAttendees).values(
        memberRows.map((member) => ({
          eventId: event.id,
          userId: member.userId,
          status: "going",
        })),
      );
    }

    const matchingVenues = SEEDED_VENUES.filter((venue) =>
      venue.sports.includes(group.sport as SportKey),
    ).slice(0, 3);

    const candidateVenueIds: string[] = [];
    for (const [index, venue] of matchingVenues.entries()) {
      const [venueRow] = await tx
        .insert(venues)
        .values({
          demoRunId: membership.demoRunId,
          name: venue.name,
          address: venue.address,
          lat: venue.lat,
          lng: venue.lng,
          sport: group.sport,
          priceTier: venue.priceTier,
          priceConfidence: venue.priceConfidence,
          source: "seeded",
          externalId: venue.externalId,
        })
        .onConflictDoUpdate({
          target: [venues.source, venues.externalId],
          set: {
            name: venue.name,
            address: venue.address,
            lat: venue.lat,
            lng: venue.lng,
            sport: group.sport,
            priceTier: venue.priceTier,
            priceConfidence: venue.priceConfidence,
          },
        })
        .returning({ id: venues.id });

      if (venueRow) {
        candidateVenueIds.push(venueRow.id);
        await tx.insert(eventVenueCandidates).values({
          eventId: event.id,
          venueId: venueRow.id,
          rank: index + 1,
          distanceKm: (index + 1).toFixed(2),
          reason: venueReason(user.locale, index + 1),
        });
      }
    }

    if (candidateVenueIds.length > 0) {
      await tx.insert(votes).values({
        demoRunId: membership.demoRunId,
        groupId: group.id,
        eventId: event.id,
        topic: "venue",
        createdByUserId: user.id,
      });
    }

    await tx.insert(messages).values({
      demoRunId: membership.demoRunId,
      scopeType: "group",
      groupId: group.id,
      userId: user.id,
      kind: "event_proposed",
      body: copy.groupMessage,
    });

    await tx.insert(messages).values({
      demoRunId: membership.demoRunId,
      scopeType: "event",
      eventId: event.id,
      userId: user.id,
      kind: "system",
      body: copy.eventMessage,
    });

    return event;
  });

  if (!createdEvent) {
    return actionError("internal");
  }

  return actionOk({
    event: {
      id: createdEvent.id,
      title: createdEvent.title,
      whenAt: createdEvent.whenAt.toISOString(),
    },
  });
}

export async function getUserEventsList(
  userId: string,
  filter: UserEventsFilter,
): Promise<UserEventsListItem[]> {
  const parsedUserId = userIdSchema.safeParse(userId);
  const parsedFilter = userEventsFilterSchema.safeParse(filter);
  if (!parsedUserId.success || !parsedFilter.success) {
    return [];
  }

  const db = getDb();
  const now = new Date();

  const myAttendance = await db
    .select({
      eventId: eventAttendees.eventId,
      myStatus: eventAttendees.status,
    })
    .from(eventAttendees)
    .where(
      and(
        eq(eventAttendees.userId, parsedUserId.data),
        inArray(eventAttendees.status, ["going", "maybe", "declined"]),
      ),
    );

  if (myAttendance.length === 0) {
    return [];
  }

  const eventIds = myAttendance.map((row) => row.eventId);
  const statusByEvent = new Map(
    myAttendance.map((row) => [row.eventId, row.myStatus]),
  );

  const baseEventPredicate = and(
    inArray(events.id, eventIds),
    inArray(events.status, LISTABLE_EVENT_STATUSES),
  );

  const wherePredicate =
    parsedFilter.data === "upcoming"
      ? and(baseEventPredicate, gte(events.whenAt, now))
      : parsedFilter.data === "past"
        ? and(baseEventPredicate, lt(events.whenAt, now))
        : baseEventPredicate;

  const orderByExpr =
    parsedFilter.data === "past" ? desc(events.whenAt) : asc(events.whenAt);

  const eventRows = await db
    .select({
      id: events.id,
      title: events.title,
      sport: events.sport,
      whenAt: events.whenAt,
      durationMin: events.durationMin,
      customLocationText: events.customLocationText,
      groupId: events.groupId,
    })
    .from(events)
    .where(wherePredicate)
    .orderBy(orderByExpr);

  if (eventRows.length === 0) {
    return [];
  }

  const visibleEventIds = eventRows.map((row) => row.id);

  const candidateRows = await db
    .select({
      eventId: eventVenueCandidates.eventId,
      rank: eventVenueCandidates.rank,
      venueName: venues.name,
    })
    .from(eventVenueCandidates)
    .innerJoin(venues, eq(venues.id, eventVenueCandidates.venueId))
    .where(inArray(eventVenueCandidates.eventId, visibleEventIds))
    .orderBy(asc(eventVenueCandidates.rank));

  const voteRows = await db
    .select({
      voteId: votes.id,
      eventId: votes.eventId,
      status: votes.status,
    })
    .from(votes)
    .where(
      and(
        inArray(votes.eventId, visibleEventIds),
        eq(votes.topic, "venue"),
      ),
    );

  const voteIdsByEvent = new Map<string, string>();
  for (const row of voteRows) {
    if (row.eventId) {
      voteIdsByEvent.set(row.eventId, row.voteId);
    }
  }

  const voteIds = voteRows.map((row) => row.voteId);
  const choiceRows =
    voteIds.length > 0
      ? await db
          .select({
            voteId: voteChoices.voteId,
            optionIdx: voteChoices.optionIdx,
          })
          .from(voteChoices)
          .where(inArray(voteChoices.voteId, voteIds))
      : [];

  const candidatesByEvent = new Map<
    string,
    Array<{ rank: number; name: string }>
  >();
  for (const row of candidateRows) {
    const list = candidatesByEvent.get(row.eventId) ?? [];
    list.push({ rank: row.rank, name: row.venueName });
    candidatesByEvent.set(row.eventId, list);
  }

  const voteCountsByVote = new Map<string, Map<number, number>>();
  for (const row of choiceRows) {
    const counts = voteCountsByVote.get(row.voteId) ?? new Map<number, number>();
    counts.set(row.optionIdx, (counts.get(row.optionIdx) ?? 0) + 1);
    voteCountsByVote.set(row.voteId, counts);
  }

  function venueLabelFor(eventId: string, fallback: string | null): string | null {
    const candidates = candidatesByEvent.get(eventId);
    if (!candidates || candidates.length === 0) {
      return fallback;
    }
    const ordered = [...candidates].sort((a, b) => a.rank - b.rank);
    const voteId = voteIdsByEvent.get(eventId);
    if (voteId) {
      const counts = voteCountsByVote.get(voteId);
      if (counts && counts.size > 0) {
        const ranked = ordered.map((candidate, idx) => ({
          name: candidate.name,
          rank: candidate.rank,
          votes: counts.get(idx) ?? 0,
        }));
        ranked.sort(
          (a, b) => b.votes - a.votes || a.rank - b.rank,
        );
        if (ranked[0] && ranked[0].votes > 0) {
          return ranked[0].name;
        }
      }
    }
    return ordered[0]?.name ?? fallback;
  }

  return eventRows.map((row) => ({
    id: row.id,
    title: row.title,
    sport: row.sport as SportKey,
    whenAt: row.whenAt.toISOString(),
    durationMin: row.durationMin,
    venueLabel: venueLabelFor(row.id, row.customLocationText),
    rsvp: (statusByEvent.get(row.id) ?? "unknown") as
      | "going"
      | "maybe"
      | "declined"
      | "unknown",
    groupId: row.groupId,
    isPast: row.whenAt < now,
  }));
}

export async function getCaptainGroups(userId: string): Promise<CaptainGroup[]> {
  const parsedUserId = userIdSchema.safeParse(userId);
  if (!parsedUserId.success) {
    return [];
  }

  const rows = await getDb()
    .select({
      id: groups.id,
      sport: groups.sport,
      city: groups.city,
      sizeTarget: groups.sizeTarget,
      status: groups.status,
    })
    .from(groups)
    .innerJoin(groupMembers, eq(groupMembers.groupId, groups.id))
    .where(
      and(
        eq(groupMembers.userId, parsedUserId.data),
        eq(groupMembers.role, "captain"),
        eq(groupMembers.status, "confirmed"),
        eq(groups.status, "active"),
      ),
    )
    .orderBy(desc(groups.createdAt));

  return rows.map((row) => ({
    id: row.id,
    sport: row.sport as SportKey,
    city: row.city,
    sizeTarget: row.sizeTarget,
    status: row.status,
  }));
}

export async function updateEventRsvpAction(
  input: UpdateEventRsvpInput,
): Promise<ActionResult<{ status: UpdateEventRsvpInput["status"] }>> {
  const parsed = updateEventRsvpInputSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("validation");
  }

  const user = await getCurrentUser();
  if (!user) {
    return actionError("unauthorized");
  }

  const [attendee] = await getDb()
    .update(eventAttendees)
    .set({ status: parsed.data.status })
    .where(
      and(
        eq(eventAttendees.eventId, parsed.data.eventId),
        eq(eventAttendees.userId, user.id),
      ),
    )
    .returning({ status: eventAttendees.status });

  if (!attendee) {
    return actionError("not_found");
  }

  return actionOk({ status: parsed.data.status });
}
