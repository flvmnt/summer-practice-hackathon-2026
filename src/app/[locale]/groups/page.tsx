import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GroupListItem } from "@/components/groups/GroupListItem";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Glyph } from "@/components/ui/Glyph";
import { getDb } from "@/db";
import { groupMembers, groups, users } from "@/db/schema";
import type { AppLocale } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth-current-user";
import { SPORTS, type SportKey } from "@/lib/sports";

export const dynamic = "force-dynamic";

const COPY = {
  en: {
    title: "Your groups",
    subtitle: "Active groups you're a member of.",
    captain: "Captain",
    open: "Open",
    count: (n: number, t: number) => `${n}/${t} players`,
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

/**
 * Lists the groups the current user is an active member of. Reads directly
 * from Drizzle (no shared lib helper exists yet) — see TODO below for moving
 * this into `src/lib/groups.ts` once that module exists.
 *
 * TODO(backend): introduce `getUserGroupsList()` action in `src/lib/groups.ts`
 * with proper ownership and demoRunId scoping, then swap the inline query.
 */
async function getUserGroupsList(userId: string) {
  const db = getDb();

  const myGroups = await db
    .select({
      groupId: groups.id,
      sport: groups.sport,
      sizeTarget: groups.sizeTarget,
      captainUserId: groups.captainUserId,
      status: groups.status,
      myRole: groupMembers.role,
    })
    .from(groupMembers)
    .innerJoin(groups, eq(groups.id, groupMembers.groupId))
    .where(
      and(
        eq(groupMembers.userId, userId),
        eq(groupMembers.status, "confirmed"),
      ),
    )
    .orderBy(desc(groups.createdAt));

  if (myGroups.length === 0) {
    return [] as Array<{
      id: string;
      sport: SportKey;
      sizeTarget: number;
      captainUserId: string | null;
      isCaptain: boolean;
      memberCount: number;
      members: Array<{ userId: string; fullName: string }>;
    }>;
  }

  const groupIds = myGroups.map((g) => g.groupId);

  const memberRows = await db
    .select({
      groupId: groupMembers.groupId,
      userId: groupMembers.userId,
      fullName: users.fullName,
    })
    .from(groupMembers)
    .innerJoin(users, eq(users.id, groupMembers.userId))
    .where(
      and(
        inArray(groupMembers.groupId, groupIds),
        eq(groupMembers.status, "confirmed"),
      ),
    )
    .orderBy(asc(groupMembers.joinedAt));

  const byGroup = new Map<
    string,
    Array<{ userId: string; fullName: string }>
  >();
  for (const row of memberRows) {
    const list = byGroup.get(row.groupId) ?? [];
    list.push({ userId: row.userId, fullName: row.fullName });
    byGroup.set(row.groupId, list);
  }

  return myGroups.map((g) => {
    const members = byGroup.get(g.groupId) ?? [];
    return {
      id: g.groupId,
      sport: g.sport as SportKey,
      sizeTarget: g.sizeTarget,
      captainUserId: g.captainUserId,
      isCaptain: g.captainUserId === userId,
      memberCount: members.length,
      members,
    };
  });
}

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
                  sizeTarget={group.sizeTarget}
                  members={group.members}
                  isCaptain={group.isCaptain}
                  captainBadgeLabel={copy.captain}
                  openLabel={copy.open}
                  countLabel={copy.count(group.memberCount, group.sizeTarget)}
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
