import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { NotificationInboxActions } from "@/components/notifications/NotificationInboxActions";
import type {
  NotificationItem,
  NotificationKind,
} from "@/components/notifications/NotificationInbox";
import { Glyph } from "@/components/ui/Glyph";
import { Pill } from "@/components/ui/Pill";
import type { AppLocale } from "@/i18n/routing";
import { listNotifications, unreadCount } from "@/lib/notifications";
import { getOnboardingUserState } from "@/lib/onboarding-state";

export const dynamic = "force-dynamic";

const KIND_BY_TYPE: Record<string, NotificationKind> = {
  "match-ready": "match-ready",
  "vote-closing": "vote-closing",
  "event-confirmed": "event-confirmed",
  "chat-mention": "chat-mention",
  match: "match-ready",
  vote: "vote-closing",
  event: "event-confirmed",
  chat: "chat-mention",
  mention: "chat-mention",
};

function toKind(type: string): NotificationKind {
  return KIND_BY_TYPE[type] ?? "match-ready";
}

export default async function NotificationsPage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("notifications");

  const user = await getOnboardingUserState();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  const [rows, unread] = await Promise.all([
    listNotifications(user.id, { limit: 50 }),
    unreadCount(user.id),
  ]);

  const items: NotificationItem[] = rows.map((row) => ({
    id: row.id,
    kind: toKind(row.type),
    title: row.title,
    body: row.body ?? "",
    href: row.href ?? `/${locale}/notifications`,
    read: row.readAt !== null,
    createdAt: row.createdAt.toISOString(),
  }));

  const inboxLabel = t("eyebrow");
  const titleLabel = t("title");
  const backLabel = t("back");
  const countLabel =
    unread > 0 ? t("unreadCount", { count: unread }) : t("allCaughtUp");
  const emptyTitle = t("emptyTitle");
  const emptyBody = t("emptyBody");
  const emptyActionLabel = t("emptyAction");
  const emptyFilteredTitle = t("emptyFilteredTitle");
  const emptyFilteredBody = t("emptyFilteredBody");
  const inboxCopy = {
    markAllRead: t("markAllRead"),
    markRead: t("markRead"),
    open: t("open"),
    unreadCount: t.raw("unreadCount") as string,
    allCaughtUp: t("allCaughtUp"),
    filterAria: t("filterAria"),
    justNow: t("relativeTime.justNow"),
    filters: {
      all: t("filters.all"),
      unread: t("filters.unread"),
      match: t("filters.match"),
      vote: t("filters.vote"),
      event: t("filters.event"),
      chat: t("filters.chat"),
    },
    kinds: {
      "match-ready": t("kinds.matchReady"),
      "vote-closing": t("kinds.voteClosing"),
      "event-confirmed": t("kinds.eventConfirmed"),
      "chat-mention": t("kinds.chatMention"),
    },
  };

  return (
    <main
      className="relative min-h-screen w-full md:pl-[240px]"
      style={{
        background: "var(--bg)",
        color: "var(--ink)",
        paddingBottom: "calc(96px + env(safe-area-inset-bottom) + 16px)",
      }}
    >      <header
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
            aria-label={backLabel}
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
              {inboxLabel}
            </div>
            <h1
              className="display"
              style={{ fontSize: 20, lineHeight: 1.1 }}
            >
              {titleLabel}
            </h1>
          </div>
        </div>
        <Pill variant={unread > 0 ? "accent" : "default"}>
          <span
            style={{ color: unread > 0 ? "var(--accent)" : "var(--ink-muted)" }}
          >
            {countLabel}
          </span>
        </Pill>
      </header>

      <section
        className="mx-auto w-full px-4 pt-5"
        style={{ maxWidth: 720 }}
      >
        <NotificationInboxActions
          initialItems={items}
          copy={inboxCopy}
          emptyTitle={emptyTitle}
          emptyBody={emptyBody}
          emptyActionLabel={emptyActionLabel}
          emptyActionHref={`/${locale}/today`}
          emptyFilteredTitle={emptyFilteredTitle}
          emptyFilteredBody={emptyFilteredBody}
        />
      </section>    </main>
  );
}
