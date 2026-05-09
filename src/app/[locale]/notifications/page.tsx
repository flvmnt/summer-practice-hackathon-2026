import Link from "next/link";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { NotificationInboxActions } from "@/components/notifications/NotificationInboxActions";
import type { NotificationItem } from "@/components/notifications/NotificationInbox";
import { Glyph } from "@/components/ui/Glyph";
import type { AppLocale } from "@/i18n/routing";
import { getOnboardingUserState } from "@/lib/onboarding-state";

export const dynamic = "force-dynamic";

// TODO: replace with real notifications query (depends on a future
// notifications schema migration). For now we render an in-memory list of
// 8 demo-safe entries covering all 4 notification kinds — this lets the
// inbox UI ship without blocking on backend persistence.
async function getNotificationsAction(
  locale: AppLocale,
): Promise<{ ok: true; data: ReadonlyArray<NotificationItem> }> {
  const items: ReadonlyArray<NotificationItem> = [
    {
      id: "n1",
      kind: "match-ready",
      title: "Football group formed near Herastrau",
      body: "10 players said yes within 6 km. Captain reveal in 8 min.",
      href: `/${locale}/groups/demo-football`,
      read: false,
      createdAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    },
    {
      id: "n2",
      kind: "vote-closing",
      title: "Vote closing in 12 min",
      body: "Baza Sportiva is leading 6-3 vs Stadionul Tineretului.",
      href: `/${locale}/events/demo-event-1?tab=vote`,
      read: false,
      createdAt: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
    },
    {
      id: "n3",
      kind: "event-confirmed",
      title: "Event confirmed: Sat 18:00, Baza 2",
      body: "Calendar export is ready. Bring water and clean shoes.",
      href: `/${locale}/events/demo-event-1`,
      read: false,
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
    {
      id: "n4",
      kind: "chat-mention",
      title: "Andrei mentioned you",
      body: "\"@you can you bring the second ball?\"",
      href: `/${locale}/groups/demo-football?tab=chat`,
      read: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "n5",
      kind: "match-ready",
      title: "Tennis singles match found",
      body: "Maria, level 4, 3.2 km away. Reply within 10 min.",
      href: `/${locale}/groups/demo-tennis`,
      read: true,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "n6",
      kind: "event-confirmed",
      title: "Reminder: basketball pickup tomorrow",
      body: "Sun 10:00, Sala Polivalenta court B.",
      href: `/${locale}/events/demo-event-2`,
      read: true,
      createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "n7",
      kind: "vote-closing",
      title: "Vote closed",
      body: "Tomorrow's running route: Herastrau loop won (8 votes).",
      href: `/${locale}/events/demo-event-3?tab=vote`,
      read: true,
      createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "n8",
      kind: "chat-mention",
      title: "Captain replied to your question",
      body: "\"Yes, parking is free until 20:00 on weekends.\"",
      href: `/${locale}/groups/demo-football?tab=chat`,
      read: true,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
  return { ok: true, data: items };
}

export default async function NotificationsPage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getOnboardingUserState();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  const result = await getNotificationsAction(locale);
  const items = result.ok ? result.data : [];

  return (
    <main
      className="relative min-h-screen w-full"
      style={{
        background: "var(--bg)",
        color: "var(--ink)",
        paddingBottom: "calc(96px + env(safe-area-inset-bottom))",
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "12px 16px",
          background: "color-mix(in oklch, var(--surface) 92%, transparent)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div className="flex items-center gap-2">
          <Link
            href={`/${locale}/today`}
            aria-label="Back to Today"
            className="inline-flex items-center justify-center rounded-full"
            style={{
              width: 36,
              height: 36,
              background: "var(--surface)",
              boxShadow: "inset 0 0 0 1px var(--line)",
              color: "var(--ink)",
            }}
          >
            <Glyph.back size={16} />
          </Link>
          <div className="min-w-0">
            <div
              className="mono"
              style={{
                fontSize: 10,
                color: "var(--ink-muted)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Inbox
            </div>
            <h1
              className="display"
              style={{ fontSize: 20, lineHeight: 1.1 }}
            >
              Notifications
            </h1>
          </div>
        </div>
      </header>

      <section
        className="mx-auto w-full px-4 pt-5"
        style={{ maxWidth: 720 }}
      >
        <NotificationInboxActions
          initialItems={items}
          emptyTitle="You're caught up"
          emptyBody="New matches, votes, and event updates will appear here."
        />
      </section>

      <MobileTabBar />
    </main>
  );
}
