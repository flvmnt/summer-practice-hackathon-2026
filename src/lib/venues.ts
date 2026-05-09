"use server";

import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { eventVenueCandidates, events, users, venues } from "@/db/schema";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth-current-user";
import { getServerEnv } from "@/lib/env";
import { haversineKm } from "@/lib/matching-core";
import { SPORT_KEYS, type SportKey } from "@/lib/sports";

export type NearbyVenue = {
  id: string;
  name: string;
  sport: SportKey;
  lat: number;
  lng: number;
  address: string | null;
  distanceKm: number;
  upcomingPublicEventCount: number;
};

const DEFAULT_RADIUS_KM = 10;
const DEFAULT_PUBLIC_MAP_CENTER = { lat: 45.7537, lng: 21.2257 } as const;
const PUBLIC_EVENT_STATUSES = ["proposed", "confirmed"];

const inputSchema = z.object({
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  radiusKm: z.number().gt(0).max(50).optional(),
  sport: z.enum(SPORT_KEYS).optional(),
});

export type GetNearbyVenuesInput = z.input<typeof inputSchema>;

async function resolveCenter(
  inputLat: number | undefined,
  inputLng: number | undefined,
): Promise<{ lat: number; lng: number }> {
  if (typeof inputLat === "number" && typeof inputLng === "number") {
    return { lat: inputLat, lng: inputLng };
  }

  const current = await getCurrentUser();
  if (current) {
    const [row] = await getDb()
      .select({ homeLat: users.homeLat, homeLng: users.homeLng })
      .from(users)
      .where(eq(users.id, current.id))
      .limit(1);

    if (row?.homeLat && row.homeLng) {
      const lat = Number(row.homeLat);
      const lng = Number(row.homeLng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng };
      }
    }
  }

  return { lat: DEFAULT_PUBLIC_MAP_CENTER.lat, lng: DEFAULT_PUBLIC_MAP_CENTER.lng };
}

export async function getNearbyVenuesAction(
  input: GetNearbyVenuesInput = {},
): Promise<ActionResult<{ venues: NearbyVenue[]; center: { lat: number; lng: number }; radiusKm: number }>> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("validation");
  }

  let databaseUrl: string | undefined;
  try {
    databaseUrl = getServerEnv().DATABASE_URL;
  } catch {
    return actionError("venues.unavailable");
  }
  if (!databaseUrl) {
    return actionError("venues.unavailable");
  }

  const radiusKm = parsed.data.radiusKm ?? DEFAULT_RADIUS_KM;
  const sportFilter = parsed.data.sport;

  try {
    const center = await resolveCenter(parsed.data.lat, parsed.data.lng);
    const baseConditions = sportFilter ? eq(venues.sport, sportFilter) : undefined;

    const venueRows = await getDb()
      .select({
        id: venues.id,
        name: venues.name,
        address: venues.address,
        lat: venues.lat,
        lng: venues.lng,
        sport: venues.sport,
      })
      .from(venues)
      .where(baseConditions);

    const withDistance = venueRows
      .map((row) => {
        const lat = Number(row.lat);
        const lng = Number(row.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          return null;
        }
        const distanceKm = haversineKm(center, { lat, lng });
        return {
          id: row.id,
          name: row.name,
          sport: row.sport as SportKey,
          lat,
          lng,
          address: row.address,
          distanceKm,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .filter((row) => row.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    const ids = withDistance.map((row) => row.id);
    const counts = new Map<string, number>();

    if (ids.length > 0) {
      const now = new Date();
      const eventCountRows = await getDb()
        .select({
          venueId: eventVenueCandidates.venueId,
          count: sql<number>`count(*)::int`,
        })
        .from(eventVenueCandidates)
        .innerJoin(events, eq(events.id, eventVenueCandidates.eventId))
        .where(
          and(
            inArray(eventVenueCandidates.venueId, ids),
            inArray(events.status, PUBLIC_EVENT_STATUSES),
            gte(events.whenAt, now),
          ),
        )
        .groupBy(eventVenueCandidates.venueId);

      for (const row of eventCountRows) {
        counts.set(row.venueId, Number(row.count));
      }
    }

    const result: NearbyVenue[] = withDistance.map((row) => ({
      id: row.id,
      name: row.name,
      sport: row.sport,
      lat: row.lat,
      lng: row.lng,
      address: row.address,
      distanceKm: Math.round(row.distanceKm * 100) / 100,
      upcomingPublicEventCount: counts.get(row.id) ?? 0,
    }));

    return actionOk({ venues: result, center, radiusKm });
  } catch {
    return actionError("venues.unavailable");
  }
}
