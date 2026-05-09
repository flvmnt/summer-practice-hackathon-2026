import { and, eq, isNull } from "drizzle-orm";
import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import {
  MatchPercentPanel,
  type MatchBreakdownRow,
} from "@/components/profile/MatchPercentPanel";
import { PublicProfileCard } from "@/components/profile/PublicProfileCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Glyph } from "@/components/ui/Glyph";
import { getDb } from "@/db";
import { userSports, users } from "@/db/schema";
import type { AppLocale } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth-current-user";
import { getOnboardingUserState } from "@/lib/onboarding-state";
import type { SportKey } from "@/lib/sports";

export const dynamic = "force-dynamic";

const COPY = {
  en: {
    eyebrow: "Profile",
    private: "This profile is private.",
    privateBody: "Only members of shared groups can see it.",
    cityLabel: "City",
    sportsLabel: "Sports",
    matchTitle: "Compatibility",
    matchSubtitle: "Estimated match with you",
    matchBreakdown: {
      sport: "Shared sports",
      skill: "Skill match",
      distance: "Within travel radius",
    },
    notFoundTitle: "Player not found",
    notFoundBody: "This username doesn't exist or has been removed.",
    back: "Back",
    activeIn: (n: number) =>
      n === 1 ? `Active in ${n} group` : `Active in ${n} groups`,
    sportLabels: {
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
    } as Record<SportKey, string>,
  },
  ro: {
    eyebrow: "Profil",
    private: "Acest profil este privat.",
    privateBody: "Doar membrii grupurilor comune îl pot vedea.",
    cityLabel: "Oraș",
    sportsLabel: "Sporturi",
    matchTitle: "Compatibilitate",
    matchSubtitle: "Match estimativ cu tine",
    matchBreakdown: {
      sport: "Sporturi comune",
      skill: "Match nivel",
      distance: "În raza ta",
    },
    notFoundTitle: "Jucător negăsit",
    notFoundBody: "Acest username nu există sau a fost șters.",
    back: "Înapoi",
    activeIn: (n: number) =>
      n === 1 ? `Activ în ${n} grup` : `Activ în ${n} grupuri`,
    sportLabels: {
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
    } as Record<SportKey, string>,
  },
};

/**
 * Public profile lookup. Reads directly from Drizzle.
 *
 * TODO(backend): introduce `getPublicUserByUsername(username)` in
 * `src/lib/auth.ts` or `src/lib/profile.ts` so route consumers don't reach
 * into the schema. Should also include "active in N groups" via a join.
 */
async function getPublicUserByUsername(username: string) {
  const db = getDb();
  const [row] = await db
    .select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      bio: users.bio,
      city: users.city,
      photoUrl: users.photoUrl,
      profileVisibility: users.profileVisibility,
      skillLevel: users.skillLevel,
    })
    .from(users)
    .where(
      and(
        eq(users.username, username),
        isNull(users.bannedAt),
        isNull(users.deletedAt),
      ),
    )
    .limit(1);

  if (!row) return null;

  const sportRows = await db
    .select({
      sport: userSports.sport,
      level: userSports.level,
    })
    .from(userSports)
    .where(eq(userSports.userId, row.id));

  return {
    ...row,
    sports: sportRows.map((s) => ({
      sport: s.sport as SportKey,
      level: s.level ?? 3,
    })),
  };
}

/**
 * Placeholder compatibility score. Mirrors the four matching dimensions in
 * spec §14 (sport, skill, distance, group fit) but is not the real lib.
 *
 * TODO(matching): replace with the canonical scoring lib once
 * `src/lib/matching-core.ts` exposes a per-pair compatibility helper.
 */
function computePlaceholderMatch(
  viewerSports: ReadonlyArray<{ sport: SportKey; level: number }>,
  viewerMaxDistanceKm: number,
  target: {
    sports: ReadonlyArray<{ sport: SportKey; level: number }>;
    skillLevel: number | null;
  },
) {
  const viewerSportSet = new Set(viewerSports.map((s) => s.sport));
  const targetSportSet = new Set(target.sports.map((s) => s.sport));
  const shared = [...viewerSportSet].filter((s) => targetSportSet.has(s));
  const sportScore =
    viewerSportSet.size === 0
      ? 0
      : Math.round((shared.length / viewerSportSet.size) * 100);

  // Skill: closer averages = higher score.
  const viewerAvg =
    viewerSports.length > 0
      ? viewerSports.reduce((t, s) => t + s.level, 0) / viewerSports.length
      : 3;
  const targetAvg =
    target.sports.length > 0
      ? target.sports.reduce((t, s) => t + s.level, 0) / target.sports.length
      : (target.skillLevel ?? 3);
  const skillScore = Math.round(
    Math.max(0, 100 - Math.abs(viewerAvg - targetAvg) * 25),
  );

  // Distance is unknown without target lat/lng; use viewerMaxDistanceKm as a
  // soft proxy: if 5+ km, default to within radius, else slightly less.
  const distanceScore = viewerMaxDistanceKm >= 5 ? 90 : 70;

  const overall = Math.round(
    sportScore * 0.5 + skillScore * 0.3 + distanceScore * 0.2,
  );

  return {
    overall,
    breakdown: { sport: sportScore, skill: skillScore, distance: distanceScore },
  };
}

export default async function PublicProfilePage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale; username: string }>;
}>) {
  const { locale, username } = await params;
  setRequestLocale(locale);

  const copy = COPY[locale];
  const target = await getPublicUserByUsername(username);

  // Not found
  if (!target) {
    return (
      <main
        className="relative min-h-screen w-full"
        style={{
          background: "var(--surface-2)",
          color: "var(--ink)",
          paddingBottom: "calc(78px + env(safe-area-inset-bottom))",
        }}
      >
        <div className="mx-auto w-full max-w-xl px-5 pt-10">
          <EmptyState
            glyph={<Glyph.profile size={28} />}
            title={copy.notFoundTitle}
            body={copy.notFoundBody}
            action={{
              label: copy.back,
              href: `/${locale}/today`,
            }}
          />
        </div>
        <MobileTabBar />
      </main>
    );
  }

  const viewer = await getCurrentUser();
  const viewerState = viewer ? await getOnboardingUserState() : null;
  const isOwner = viewer?.id === target.id;
  const isPrivate =
    target.profileVisibility !== "public" && !isOwner;

  // Private profile (sport-themed mini empty state).
  if (isPrivate) {
    return (
      <main
        className="relative min-h-screen w-full"
        style={{
          background: "var(--surface-2)",
          color: "var(--ink)",
          paddingBottom: "calc(78px + env(safe-area-inset-bottom))",
        }}
      >
        <div className="mx-auto w-full max-w-xl px-5 pt-10">
          <EmptyState
            glyph={<Glyph.lock size={28} />}
            title={copy.private}
            body={copy.privateBody}
            action={
              viewer
                ? {
                    label: copy.back,
                    href: `/${locale}/today`,
                  }
                : {
                    label: copy.back,
                    href: `/${locale}/login`,
                  }
            }
          />
        </div>
        <MobileTabBar />
      </main>
    );
  }

  const sports = target.sports.map((s) => ({
    sport: s.sport,
    level: s.level,
    label: copy.sportLabels[s.sport] ?? s.sport,
  }));

  const match =
    viewer && viewerState && !isOwner
      ? computePlaceholderMatch(viewerState.sports, viewerState.maxDistanceKm, {
          sports: target.sports,
          skillLevel: target.skillLevel,
        })
      : null;

  const breakdownRows: MatchBreakdownRow[] = match
    ? [
        { label: copy.matchBreakdown.sport, value: match.breakdown.sport },
        { label: copy.matchBreakdown.skill, value: match.breakdown.skill },
        { label: copy.matchBreakdown.distance, value: match.breakdown.distance },
      ]
    : [];

  return (
    <main
      className="relative min-h-screen w-full"
      style={{
        background: "var(--surface-2)",
        color: "var(--ink)",
        paddingBottom: "calc(78px + env(safe-area-inset-bottom))",
      }}
    >
      <header className="flex items-center gap-3 px-5 pt-6 md:hidden">
        <Link
          href={viewer ? `/${locale}/today` : `/${locale}`}
          aria-label={copy.back}
          className="grid place-items-center"
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            background: "var(--surface)",
            color: "var(--ink)",
            border: "1px solid var(--line)",
          }}
        >
          <Glyph.back size={16} />
        </Link>
        <div className="min-w-0 flex-1">
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--ink-muted)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {copy.eyebrow}
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-5 pt-4 md:pt-10">
        <div className="hidden md:block">
          <Link
            href={viewer ? `/${locale}/today` : `/${locale}`}
            className="btn-s2m btn-secondary inline-flex"
            style={{ minHeight: 40, padding: "8px 14px", fontSize: 13 }}
          >
            <Glyph.back size={16} />
            {copy.back}
          </Link>
        </div>

        <PublicProfileCard
          fullName={target.fullName}
          username={target.username}
          bio={target.bio}
          city={target.city}
          photoUrl={target.photoUrl}
          sports={sports}
          cityLabel={copy.cityLabel}
          sportsLabel={copy.sportsLabel}
        />

        {match ? (
          <MatchPercentPanel
            title={copy.matchTitle}
            subtitle={copy.matchSubtitle}
            percent={match.overall}
            breakdown={breakdownRows}
          />
        ) : null}
      </div>

      <MobileTabBar />
    </main>
  );
}
