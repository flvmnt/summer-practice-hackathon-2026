import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { HeaderBell } from "@/components/layout/HeaderBell";
import {
  MatchPercentPanel,
  type MatchBreakdownRow,
} from "@/components/profile/MatchPercentPanel";
import { PublicProfileCard } from "@/components/profile/PublicProfileCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Glyph } from "@/components/ui/Glyph";
import type { AppLocale } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth-current-user";
import { unreadCount } from "@/lib/notifications";
import {
  getCompatibilityForViewer,
  getPublicUserByUsername,
} from "@/lib/profile-public";
import type { SportKey } from "@/lib/sports";

export const dynamic = "force-dynamic";

const COPY = {
  en: {
    eyebrow: "Profile",
    cityLabel: "City",
    sportsLabel: "Sports",
    matchTitle: "Compatibility",
    matchSubtitle: "Estimated match with you",
    matchSourceAi: "Groq AI score",
    matchSourceFallback: "Rule-based estimate",
    matchRows: {
      sharedSports: "Shared sports",
      skillFit: "Skill fit",
      proximityFit: "Distance fit",
      scheduleFit: "Schedule fit",
    },
    notFoundTitle: "Player not found",
    notFoundBody: "This username doesn't exist or has been removed.",
    back: "Back",
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
    cityLabel: "Oraș",
    sportsLabel: "Sporturi",
    matchTitle: "Compatibilitate",
    matchSubtitle: "Match estimativ cu tine",
    matchSourceAi: "Scor AI Groq",
    matchSourceFallback: "Estimare pe reguli",
    matchRows: {
      sharedSports: "Sporturi comune",
      skillFit: "Potrivire skill",
      proximityFit: "Potrivire distanță",
      scheduleFit: "Potrivire program",
    },
    notFoundTitle: "Jucător negăsit",
    notFoundBody: "Acest username nu există sau a fost șters.",
    back: "Înapoi",
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

export default async function PublicProfilePage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale; username: string }>;
}>) {
  const { locale, username } = await params;
  setRequestLocale(locale);

  const copy = COPY[locale];
  const target = await getPublicUserByUsername(username);

  if (!target) {
    return (
      <main
        className="relative min-h-screen w-full md:pl-[240px]"
        style={{
          background: "var(--surface-2)",
          color: "var(--ink)",
          paddingBottom: "calc(78px + env(safe-area-inset-bottom) + 16px)",
        }}
      >        <div className="mx-auto w-full max-w-xl px-5 pt-10">
          <EmptyState
            glyph={<Glyph.profile size={28} />}
            title={copy.notFoundTitle}
            body={copy.notFoundBody}
            action={{
              label: copy.back,
              href: `/${locale}/today`,
            }}
          />
        </div>      </main>
    );
  }

  const viewer = await getCurrentUser();
  const isOwner = viewer?.id === target.id;
  const unread = viewer ? await unreadCount(viewer.id) : 0;

  const sports = target.sports.map((sport) => ({
    sport,
    level: 3,
    label: copy.sportLabels[sport] ?? sport,
  }));

  const compatibility =
    viewer && !isOwner
      ? await getCompatibilityForViewer(viewer.id, target.id)
      : null;

  const breakdownRows: MatchBreakdownRow[] = compatibility
    ? [
        {
          label: `${copy.matchRows.sharedSports}: ${
            compatibility.sharedSports.length > 0
              ? compatibility.sharedSports
                  .map((sport) => copy.sportLabels[sport] ?? sport)
                  .join(", ")
              : "0"
          }`,
          value: compatibility.sharedSports.length > 0 ? 100 : 0,
        },
        {
          label: copy.matchRows.skillFit,
          value:
            compatibility.skillFit === "balanced"
              ? 100
              : compatibility.skillFit === "mentor"
                ? 70
                : 25,
        },
        {
          label: copy.matchRows.proximityFit,
          value:
            compatibility.proximityFit === "near"
              ? 100
              : compatibility.proximityFit === "same_city"
                ? 70
                : 20,
        },
        {
          label: copy.matchRows.scheduleFit,
          value:
            compatibility.scheduleFit === "high"
              ? 100
              : compatibility.scheduleFit === "medium"
                ? 65
                : 25,
        },
      ]
    : [];

  return (
    <main
      className="relative min-h-screen w-full md:pl-[240px]"
      style={{
        background: "var(--surface-2)",
        color: "var(--ink)",
        paddingBottom: "calc(78px + env(safe-area-inset-bottom) + 16px)",
      }}
    >      <header className="flex items-center gap-3 px-5 pt-6 md:hidden">
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
        {viewer ? <HeaderBell unreadCount={unread} locale={locale} /> : null}
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
          photoUrl={target.photoUrl ?? null}
          sports={sports}
          cityLabel={copy.cityLabel}
          sportsLabel={copy.sportsLabel}
        />

        {compatibility !== null ? (
          <MatchPercentPanel
            title={copy.matchTitle}
            subtitle={copy.matchSubtitle}
            percent={compatibility.score}
            reason={compatibility.reason}
            sourceLabel={
              compatibility.source === "ai"
                ? copy.matchSourceAi
                : copy.matchSourceFallback
            }
            breakdown={breakdownRows}
          />
        ) : null}
      </div>    </main>
  );
}
