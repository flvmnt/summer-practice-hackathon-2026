import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GroupListItem } from "@/components/groups/GroupListItem";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Glyph } from "@/components/ui/Glyph";
import { Pill } from "@/components/ui/Pill";
import type { AppLocale } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth-current-user";
import { getUserGroupsList } from "@/lib/groups";
import { SPORTS, type SportKey } from "@/lib/sports";

export const dynamic = "force-dynamic";

const COPY = {
  en: {
    title: "Your groups",
    subtitle: "Active groups you're a member of.",
    captain: "Captain",
    open: "Open",
    count: (n: number, t: number) => `${n}/${t} players`,
    activeGroups: (n: number) => `${n} active`,
    captainCount: (n: number) => (n === 1 ? "1 captain" : `${n} captains`),
    emptyTitle: "No groups yet",
    emptyBody: "Answer today's prompt to form your first group.",
    emptyAction: "Go to Today",
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
    title: "Grupurile tale",
    subtitle: "Grupurile active din care faci parte.",
    captain: "Căpitan",
    open: "Deschide",
    count: (n: number, t: number) => `${n}/${t} jucători`,
    activeGroups: (n: number) => `${n} active`,
    captainCount: (n: number) => (n === 1 ? "1 căpitan" : `${n} căpitani`),
    emptyTitle: "Niciun grup încă",
    emptyBody: "Răspunde la promptul de azi pentru a forma primul grup.",
    emptyAction: "Deschide Today",
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

export default async function GroupsPage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  const copy = COPY[locale];
  const list = await getUserGroupsList(user.id);
  const captainCount = list.reduce((n, g) => (g.isCaptain ? n + 1 : n), 0);

  return (
    <main
      className="relative min-h-screen w-full"
      style={{
        background: "var(--surface-2)",
        color: "var(--ink)",
        paddingBottom: "calc(78px + env(safe-area-inset-bottom))",
      }}
    >
      <header
        className="flex items-center justify-between px-5 pt-6 md:hidden"
        style={{ gap: 12 }}
      >
        <div className="min-w-0">
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--ink-muted)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {locale === "ro" ? "Grupuri" : "Groups"}
          </div>
          <h1
            className="display"
            style={{ fontSize: 26, lineHeight: 1.05, marginTop: 2 }}
          >
            {copy.title}
          </h1>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl px-5 pt-4 md:pt-10">
        <header className="mb-6 hidden md:block">
          <h1
            className="display"
            style={{ fontSize: 36, lineHeight: 1.05, color: "var(--ink)" }}
          >
            {copy.title}
          </h1>
          <p
            className="mt-2 text-[14px]"
            style={{ color: "var(--ink-muted)", lineHeight: 1.5 }}
          >
            {copy.subtitle}
          </p>
        </header>

        {list.length > 0 ? (
          <div
            className="mb-3 flex flex-wrap items-center gap-2"
            aria-label={locale === "ro" ? "Statistici grupuri" : "Group stats"}
          >
            <Pill icon={<Glyph.groups size={11} />}>
              {copy.activeGroups(list.length)}
            </Pill>
            {captainCount > 0 ? (
              <span style={{ color: "var(--accent)" }}>
                <Pill icon={<Glyph.crown size={11} />} variant="accent">
                  {copy.captainCount(captainCount)}
                </Pill>
              </span>
            ) : null}
          </div>
        ) : null}

        {list.length === 0 ? (
          <EmptyState
            glyph={<Glyph.groups size={28} />}
            title={copy.emptyTitle}
            body={copy.emptyBody}
            action={{
              label: copy.emptyAction,
              href: `/${locale}/today`,
            }}
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {list.map((group) => (
              <li key={group.id}>
                <GroupListItem
                  href={`/${locale}/groups/${group.id}`}
                  sport={group.sport}
                  sportLabel={
                    copy.sportLabels[group.sport] ?? SPORTS[group.sport].kind
                  }
                  memberCount={group.memberCount}
                  sizeTarget={group.capacity}
                  members={group.members}
                  isCaptain={group.isCaptain}
                  captainBadgeLabel={copy.captain}
                  openLabel={copy.open}
                  countLabel={copy.count(group.memberCount, group.capacity)}
                />
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 hidden md:flex">
          <Link
            href={`/${locale}/today`}
            className="btn-s2m btn-secondary"
            style={{ minHeight: 40, padding: "8px 14px", fontSize: 13 }}
          >
            <Glyph.back size={16} />
            {locale === "ro" ? "Înapoi la Today" : "Back to Today"}
          </Link>
        </div>
      </div>

      <MobileTabBar />
    </main>
  );
}
