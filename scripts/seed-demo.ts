import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  availabilityResponses,
  demoRuns,
  eventAttendees,
  events,
  groupMembers,
  groups,
  prompts,
  userSports,
  users,
  venues,
} from "@/db/schema";
import { hashPassword, hashRecoveryCode } from "@/lib/auth-crypto";
import { activePromptWindow } from "@/lib/prompt-window";

export const DEMO_RUN_LABEL = "showup2move-demo";
const DEMO_PASSWORD = "Showup2move!";
const DEMO_RECOVERY_CODE = "DEMO-RECOV-2026";

const TIMISOARA = { lat: 45.7489, lng: 21.2087 };

type DemoUserSeed = {
  username: string;
  fullName: string;
  bio: string;
  city: string;
  homeLat: number;
  homeLng: number;
  maxDistanceKm: number;
  skillLevel: number;
  sports: { sport: string; level: number }[];
};

const DEMO_USERS: DemoUserSeed[] = [
  {
    username: "demo_alex",
    fullName: "Alex Popescu",
    bio: "Football and running, weekday evenings.",
    city: "Timisoara",
    homeLat: 45.7489,
    homeLng: 21.2087,
    maxDistanceKm: 5,
    skillLevel: 4,
    sports: [
      { sport: "football", level: 4 },
      { sport: "running", level: 3 },
    ],
  },
  {
    username: "demo_maria",
    fullName: "Maria Ionescu",
    bio: "Tennis 3x/week, casual yoga.",
    city: "Timisoara",
    homeLat: 45.7544,
    homeLng: 21.2256,
    maxDistanceKm: 5,
    skillLevel: 3,
    sports: [
      { sport: "tennis", level: 3 },
      { sport: "yoga", level: 2 },
    ],
  },
  {
    username: "demo_radu",
    fullName: "Radu Stan",
    bio: "Football midfielder, basketball pickup.",
    city: "Timisoara",
    homeLat: 45.7398,
    homeLng: 21.2278,
    maxDistanceKm: 5,
    skillLevel: 3,
    sports: [
      { sport: "football", level: 3 },
      { sport: "basketball", level: 3 },
    ],
  },
  {
    username: "demo_ioana",
    fullName: "Ioana Marin",
    bio: "Football, volleyball, and trail running.",
    city: "Timisoara",
    homeLat: 45.7521,
    homeLng: 21.2191,
    maxDistanceKm: 5,
    skillLevel: 4,
    sports: [
      { sport: "football", level: 4 },
      { sport: "volleyball", level: 3 },
    ],
  },
];

const DEMO_VENUES = [
  {
    name: "Parcul Rozelor Pitch",
    address: "Parcul Rozelor, Timisoara",
    lat: 45.7461,
    lng: 21.226,
    sport: "football",
    priceTier: "free",
    priceConfidence: "verified",
    source: "seeded",
    externalId: "demo-rozelor-football",
  },
  {
    name: "Iulius Town Tennis",
    address: "Iulius Town, Timisoara",
    lat: 45.7615,
    lng: 21.2333,
    sport: "tennis",
    priceTier: "paid",
    priceConfidence: "estimated",
    source: "seeded",
    externalId: "demo-iulius-tennis",
  },
];

export type SeedDemoOptions = {
  demoRunId?: string;
  label?: string;
};

export type SeedDemoResult = {
  demoRunId: string;
  label: string;
  alreadySeeded: boolean;
  seeded: {
    users: number;
    userSports: number;
    prompts: number;
    availabilityResponses: number;
    groups: number;
    groupMembers: number;
    events: number;
    eventAttendees: number;
    venues: number;
  };
};

export async function seedDemo(
  options: SeedDemoOptions = {},
): Promise<SeedDemoResult> {
  const label = options.label ?? DEMO_RUN_LABEL;
  const db = getDb();

  const existingByLabel = await db
    .select({ id: demoRuns.id })
    .from(demoRuns)
    .where(eq(demoRuns.label, label))
    .limit(1);

  let demoRunId = options.demoRunId ?? existingByLabel[0]?.id;
  let alreadySeeded = false;

  if (demoRunId) {
    const existingUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.demoRunId, demoRunId))
      .limit(1);
    alreadySeeded = existingUsers.length > 0;
  }

  if (alreadySeeded && demoRunId) {
    return summarize(demoRunId, label, true);
  }

  if (!demoRunId) {
    const [created] = await db
      .insert(demoRuns)
      .values({ label })
      .returning({ id: demoRuns.id });
    demoRunId = created!.id;
  }

  const activeDemoRunId: string = demoRunId;

  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const recoveryCodeHash = await hashRecoveryCode(DEMO_RECOVERY_CODE);

  await db.transaction(async (tx) => {
    const insertedUsers = await tx
      .insert(users)
      .values(
        DEMO_USERS.map((seed) => ({
          demoRunId: activeDemoRunId,
          username: seed.username,
          fullName: seed.fullName,
          passwordHash,
          recoveryCodeHash,
          bio: seed.bio,
          city: seed.city,
          homeLat: seed.homeLat.toFixed(6),
          homeLng: seed.homeLng.toFixed(6),
          maxDistanceKm: seed.maxDistanceKm,
          skillLevel: seed.skillLevel,
        })),
      )
      .returning({ id: users.id, username: users.username });

    const userIdByUsername = new Map(
      insertedUsers.map((row) => [row.username, row.id]),
    );

    const sportRows = DEMO_USERS.flatMap((seed) =>
      seed.sports.map((entry) => ({
        demoRunId: activeDemoRunId,
        userId: userIdByUsername.get(seed.username)!,
        sport: entry.sport,
        level: entry.level,
      })),
    );
    await tx.insert(userSports).values(sportRows);

    await tx
      .insert(venues)
      .values(
        DEMO_VENUES.map((venue) => ({
          demoRunId: activeDemoRunId,
          ...venue,
          lat: venue.lat.toFixed(6),
          lng: venue.lng.toFixed(6),
        })),
      );

    const window = activePromptWindow();
    const [insertedPrompt] = await tx
      .insert(prompts)
      .values({
        demoRunId: activeDemoRunId,
        scopeKey: `demo:${label}`,
        windowDate: window.windowDate,
        windowSlot: window.windowSlot,
        messageText: "Demo: anyone up for football tonight?",
      })
      .returning({ id: prompts.id });
    const promptId = insertedPrompt!.id;

    await tx.insert(availabilityResponses).values(
      DEMO_USERS.map((seed) => ({
        demoRunId: activeDemoRunId,
        promptId,
        userId: userIdByUsername.get(seed.username)!,
        answer: "yes" as const,
        sportPrefs: ["football"],
        lat: seed.homeLat.toFixed(6),
        lng: seed.homeLng.toFixed(6),
        maxDistanceKm: seed.maxDistanceKm,
      })),
    );

    const captainUserId = userIdByUsername.get(DEMO_USERS[0]!.username)!;
    const [insertedGroup] = await tx
      .insert(groups)
      .values({
        demoRunId: activeDemoRunId,
        promptId,
        sport: "football",
        city: "Timisoara",
        centerLat: TIMISOARA.lat.toFixed(6),
        centerLng: TIMISOARA.lng.toFixed(6),
        sizeTarget: DEMO_USERS.length,
        status: "active",
        captainUserId,
      })
      .returning({ id: groups.id });
    const groupId = insertedGroup!.id;

    await tx.insert(groupMembers).values(
      DEMO_USERS.map((seed, idx) => ({
        demoRunId: activeDemoRunId,
        groupId,
        promptId,
        userId: userIdByUsername.get(seed.username)!,
        role: idx === 0 ? "captain" : "player",
        status: "confirmed",
      })),
    );

    const eventStart = new Date(Date.now() + 6 * 60 * 60 * 1000);
    const [insertedEvent] = await tx
      .insert(events)
      .values({
        demoRunId: activeDemoRunId,
        groupId,
        title: "Demo Football Match",
        sport: "football",
        whenAt: eventStart,
        durationMin: 90,
        customLocationText: "Parcul Rozelor",
        status: "confirmed",
        createdByUserId: captainUserId,
      })
      .returning({ id: events.id });
    const eventId = insertedEvent!.id;

    await tx.insert(eventAttendees).values(
      DEMO_USERS.map((seed) => ({
        eventId,
        userId: userIdByUsername.get(seed.username)!,
        status: "going",
      })),
    );
  });

  return summarize(activeDemoRunId, label, false);
}

async function summarize(
  demoRunId: string,
  label: string,
  alreadySeeded: boolean,
): Promise<SeedDemoResult> {
  const db = getDb();
  const [
    userRows,
    sportRows,
    promptRows,
    availabilityRows,
    groupRows,
    groupMemberRows,
    eventRows,
    venueRows,
  ] = await Promise.all([
    db.select({ id: users.id }).from(users).where(eq(users.demoRunId, demoRunId)),
    db
      .select({ userId: userSports.userId })
      .from(userSports)
      .where(eq(userSports.demoRunId, demoRunId)),
    db.select({ id: prompts.id }).from(prompts).where(eq(prompts.demoRunId, demoRunId)),
    db
      .select({ id: availabilityResponses.id })
      .from(availabilityResponses)
      .where(eq(availabilityResponses.demoRunId, demoRunId)),
    db.select({ id: groups.id }).from(groups).where(eq(groups.demoRunId, demoRunId)),
    db
      .select({ userId: groupMembers.userId })
      .from(groupMembers)
      .where(eq(groupMembers.demoRunId, demoRunId)),
    db.select({ id: events.id }).from(events).where(eq(events.demoRunId, demoRunId)),
    db.select({ id: venues.id }).from(venues).where(eq(venues.demoRunId, demoRunId)),
  ]);

  const eventIds = eventRows.map((row) => row.id);
  const eventAttendeeRows = eventIds.length
    ? await db
        .select({ userId: eventAttendees.userId })
        .from(eventAttendees)
        .where(eq(eventAttendees.eventId, eventIds[0]!))
    : [];

  return {
    demoRunId,
    label,
    alreadySeeded,
    seeded: {
      users: userRows.length,
      userSports: sportRows.length,
      prompts: promptRows.length,
      availabilityResponses: availabilityRows.length,
      groups: groupRows.length,
      groupMembers: groupMemberRows.length,
      events: eventRows.length,
      eventAttendees: eventAttendeeRows.length,
      venues: venueRows.length,
    },
  };
}

const isDirectInvocation = (() => {
  if (typeof process === "undefined") return false;
  const entry = process.argv[1];
  if (!entry) return false;
  return entry.includes("seed-demo");
})();

if (isDirectInvocation) {
  const isDemoSeedEnabled =
    process.env.ALLOW_DEMO_SEED === "true" &&
    process.env.DEMO_SEED_CONFIRM === "showup2move";

  if (!isDemoSeedEnabled) {
    console.error(
      "Demo seed is disabled. Set ALLOW_DEMO_SEED=true and DEMO_SEED_CONFIRM=showup2move.",
    );
    process.exit(1);
  }

  seedDemo()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error("seed-demo failed:", error);
      process.exit(1);
    });
}
