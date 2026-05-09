"use server";

import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  eventAttendees,
  eventVenueCandidates,
  events,
  groupMembers,
  groups,
  messages,
  venues,
  votes,
} from "@/db/schema";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth-current-user";
import {
  createGroupEventInputSchema,
  type CreateGroupEventInput,
} from "@/lib/contracts/event";
import type { SportKey } from "@/lib/sports";

export type CreatedGroupEvent = {
  id: string;
  title: string;
  whenAt: string;
};

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
    .where(eq(groupMembers.groupId, parsed.data.groupId));

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
