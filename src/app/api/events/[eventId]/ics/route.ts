import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import {
  eventAttendees,
  eventVenueCandidates,
  events,
  groups,
  venues,
  voteChoices,
  votes,
} from "@/db/schema";
import { buildIcsCalendar } from "@/lib/calendar";
import { getCurrentUser } from "@/lib/auth-current-user";
import { getServerEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

const paramsSchema = z.object({
  eventId: z.string().uuid(),
});

const localeSchema = z.enum(["ro", "en"]).default("ro");

const SPORT_LABELS: Record<"ro" | "en", Record<string, string>> = {
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

function descriptionFor(locale: "ro" | "en", sport: string, groupUrl: string) {
  const sportLabel = SPORT_LABELS[locale][sport] ?? sport;

  if (locale === "ro") {
    return `Eveniment ShowUp2Move pentru ${sportLabel}. Link grup: ${groupUrl}`;
  }

  return `ShowUp2Move ${sportLabel} event. Group link: ${groupUrl}`;
}

function textCalendar(body: string, filename: string) {
  return new NextResponse(body, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "text/calendar; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function notFound() {
  return NextResponse.json(
    { ok: false, error: "not_found" },
    {
      status: 404,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function GET(
  request: Request,
  context: { params: Promise<{ eventId: string }> },
) {
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) {
    return notFound();
  }

  const [event] = await getDb()
    .select({
      id: events.id,
      groupId: events.groupId,
      title: events.title,
      whenAt: events.whenAt,
      durationMin: events.durationMin,
      customLocationText: events.customLocationText,
      groupSport: groups.sport,
    })
    .from(events)
    .innerJoin(groups, eq(groups.id, events.groupId))
    .where(eq(events.id, parsed.data.eventId))
    .limit(1);

  if (!event) {
    return notFound();
  }

  const user = await getCurrentUser();
  if (!user) {
    return notFound();
  }

  const [attendee] = await getDb()
    .select({ eventId: eventAttendees.eventId })
    .from(eventAttendees)
    .where(
      and(
        eq(eventAttendees.eventId, event.id),
        eq(eventAttendees.userId, user.id),
      ),
    )
    .limit(1);

  if (!attendee) {
    return notFound();
  }

  const candidates = await getDb()
    .select({
      venueId: venues.id,
      name: venues.name,
      address: venues.address,
      rank: eventVenueCandidates.rank,
    })
    .from(eventVenueCandidates)
    .innerJoin(venues, eq(venues.id, eventVenueCandidates.venueId))
    .where(eq(eventVenueCandidates.eventId, event.id))
    .orderBy(asc(eventVenueCandidates.rank));

  const [venueVote] = await getDb()
    .select({
      id: votes.id,
    })
    .from(votes)
    .where(and(eq(votes.eventId, event.id), eq(votes.topic, "venue")))
    .limit(1);

  const choices = venueVote
    ? await getDb()
        .select({
          optionIdx: voteChoices.optionIdx,
        })
        .from(voteChoices)
        .where(eq(voteChoices.voteId, venueVote.id))
    : [];

  const voteCounts = new Map<number, number>();
  for (const choice of choices) {
    voteCounts.set(choice.optionIdx, (voteCounts.get(choice.optionIdx) ?? 0) + 1);
  }

  const selectedCandidate = candidates
    .map((candidate, optionIdx) => ({
      ...candidate,
      optionIdx,
      voteCount: voteCounts.get(optionIdx) ?? 0,
    }))
    .sort((a, b) => b.voteCount - a.voteCount || a.rank - b.rank)[0];

  const location =
    selectedCandidate?.address ?? selectedCandidate?.name ?? event.customLocationText;
  const env = getServerEnv();
  const baseUrl = env.PUBLIC_BASE_URL ?? new URL(request.url).origin;
  const url = new URL(request.url);
  const locale = localeSchema.catch("ro").parse(url.searchParams.get("locale") ?? "ro");
  const eventUrl = `${baseUrl}/${locale}/events/${event.id}`;
  const groupUrl = `${baseUrl}/${locale}/groups/${event.groupId}`;
  const body = buildIcsCalendar({
    id: event.id,
    title: event.title,
    startsAt: event.whenAt,
    durationMin: event.durationMin,
    location,
    description: descriptionFor(locale, event.groupSport, groupUrl),
    url: eventUrl,
  });

  return textCalendar(body, `showup2move-${event.id}.ics`);
}
