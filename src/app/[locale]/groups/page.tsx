import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GroupListItem } from "@/components/groups/GroupListItem";
import { HeaderBell } from "@/components/layout/HeaderBell";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Glyph } from "@/components/ui/Glyph";
import { Pill } from "@/components/ui/Pill";
import type { AppLocale } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth-current-user";
import { getUserGroupsList } from "@/lib/groups";
import { unreadCount } from "@/lib/notifications";
import { SPORTS, type SportKey } from "@/lib/sports";

export const dynamic = "force-dynamic";

export default async function GroupsPage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("groupsList");
  const groupT = await getTranslations("group");

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  const [list, unread] = await Promise.all([
    getUserGroupsList(user.id),
    unreadCount(user.id),
  ]);
  const captainCount = list.reduce((n, g) => (g.isCaptain ? n + 1 : n), 0);

  return (
    <main
      className="relative min-h-screen w-full md:pl-[240px]"
      style={{
        background: "var(--surface-2)",
        color: "var(--ink)",
        paddingBottom: "calc(78px + env(safe-area-inset-bottom) + 16px)",
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
            {t("eyebrow")}
          </div>
          <h1
            className="display"
            style={{ fontSize: 26, lineHeight: 1.05, marginTop: 2 }}
          >
            {t("title")}
          </h1>
        </div>
        <HeaderBell unreadCount={unread} locale={locale} />
      </header>

      <div className="mx-auto w-full max-w-3xl px-5 pt-4 md:pt-10">
        <header className="mb-6 hidden md:block">
          <h1
            className="display"
            style={{ fontSize: 36, lineHeight: 1.05, color: "var(--ink)" }}
          >
            {t("title")}
          </h1>
          <p
            className="mt-2 text-[14px]"
            style={{ color: "var(--ink-muted)", lineHeight: 1.5 }}
          >
            {t("subtitle")}
          </p>
        </header>

        {list.length > 0 ? (
          <div
            className="mb-3 flex flex-wrap items-center gap-2"
            aria-label={t("statsLabel")}
          >
            <Pill icon={<Glyph.groups size={11} />}>
              {t("activeCount", { count: list.length })}
            </Pill>
            {captainCount > 0 ? (
              <span style={{ color: "var(--accent)" }}>
                <Pill icon={<Glyph.crown size={11} />} variant="accent">
                  {t("captainCount", { count: captainCount })}
                </Pill>
              </span>
            ) : null}
          </div>
        ) : null}

        {list.length === 0 ? (
          <EmptyState
            glyph={<Glyph.groups size={28} />}
            title={t("emptyTitle")}
            body={t("emptyBody")}
            action={{
              label: t("emptyAction"),
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
                    groupT(`sports.${group.sport as SportKey}`) ??
                    SPORTS[group.sport].kind
                  }
                  memberCount={group.memberCount}
                  sizeTarget={group.capacity}
                  members={group.members}
                  isCaptain={group.isCaptain}
                  captainBadgeLabel={t("captainBadge")}
                  openLabel={t("openGroup")}
                  countLabel={t("memberCount", {
                    count: group.memberCount,
                    target: group.capacity,
                  })}
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
            {t("back")}
          </Link>
        </div>
      </div>

      <DesktopSidebar unreadCount={unread} />
      <MobileTabBar />
    </main>
  );
}
