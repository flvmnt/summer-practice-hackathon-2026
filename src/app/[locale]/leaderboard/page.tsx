import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { HeaderBell } from "@/components/layout/HeaderBell";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Glyph } from "@/components/ui/Glyph";
import { Pill } from "@/components/ui/Pill";
import type { AppLocale } from "@/i18n/routing";
import { getLeaderboardAction, type LeaderboardRow } from "@/lib/leaderboard";
import { unreadCount } from "@/lib/notifications";

export const dynamic = "force-dynamic";

function rankColor(rank: number) {
  if (rank === 1) return "var(--accent)";
  if (rank === 2) return "var(--field)";
  if (rank === 3) return "var(--warn-token)";
  return "var(--ink-muted)";
}

function Row({
  row,
  isLast,
  highlight,
  pointsLabel,
  streakLabel,
  attendedLabel,
}: {
  row: LeaderboardRow;
  isLast: boolean;
  highlight: boolean;
  pointsLabel: string;
  streakLabel: string;
  attendedLabel: string;
}) {
  return (
    <div
      role="row"
      className="grid items-center"
      style={{
        gridTemplateColumns: "60px 1fr 90px",
        padding: "14px 18px",
        borderBottom: isLast ? "0" : "1px solid var(--line)",
        background: highlight ? "var(--accent-tint)" : "transparent",
      }}
    >
      <span
        className="mono"
        style={{ fontSize: 18, fontWeight: 700, color: rankColor(row.rank) }}
      >
        {row.rank.toString().padStart(2, "0")}
      </span>
      <span className="flex items-center" style={{ gap: 12, minWidth: 0 }}>
        <Avatar name={row.fullName || row.username} size={36} />
        <span style={{ minWidth: 0 }}>
          <span
            className="block truncate"
            style={{ fontWeight: 600, fontSize: 15 }}
          >
            {row.fullName || row.username}
          </span>
          <span
            className="mono"
            style={{ fontSize: 11, color: "var(--ink-muted)" }}
          >
            @{row.username} · {row.attendedCount} {attendedLabel} · {row.streak}{" "}
            {streakLabel}
          </span>
        </span>
      </span>
      <span
        className="mono"
        style={{ textAlign: "right", fontSize: 15, fontWeight: 700 }}
        aria-label={pointsLabel}
      >
        {row.points.toLocaleString()}
      </span>
    </div>
  );
}

export default async function LeaderboardPage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);

  const result = await getLeaderboardAction({ scope: "all" });
  const data = result.ok
    ? result.data
    : { rows: [], viewer: null };
  const unread = data.viewer ? await unreadCount(data.viewer.userId) : 0;

  const todayLabel = locale === "ro" ? "Astăzi" : "Today";
  const liveLabel = locale === "ro" ? "Date live" : "Live data";
  const eyebrow = locale === "ro" ? "Clasament" : "Leaderboard";
  const heading =
    locale === "ro" ? "Top jucători" : "Top players";
  const intro =
    locale === "ro"
      ? "Punctele se acordă pentru prezență, căpitanat și menținerea seriei. Top 25 după total puncte."
      : "Points are awarded for showing up, captaining, and keeping streaks alive. Top 25 by lifetime points.";
  const headerRank = locale === "ro" ? "Loc" : "Rank";
  const headerPlayer = locale === "ro" ? "Jucător" : "Player";
  const headerPoints = locale === "ro" ? "Puncte" : "Points";
  const attendedLabel =
    locale === "ro" ? "evenimente" : "events";
  const streakLabel =
    locale === "ro" ? "săpt. serie" : "wk streak";
  const youLabel = locale === "ro" ? "Tu" : "You";
  const emptyTitle =
    locale === "ro" ? "Clasamentul se formează" : "Leaderboard warming up";
  const emptyBody =
    locale === "ro"
      ? "Niciun punct înregistrat încă. Răspunde ShowUpToday și arată-te la primul eveniment ca să apari aici."
      : "No points logged yet. Answer ShowUpToday and show up to your first event to appear here.";
  const ctaLabel = locale === "ro" ? "Vezi promptul de azi" : "See today's prompt";

  const viewerOutOfList =
    data.viewer &&
    !data.rows.some((row) => row.userId === data.viewer?.userId);

  return (
    <main
      className="relative min-h-screen w-full md:pl-[240px]"
      style={{
        background: "var(--bg)",
        color: "var(--ink)",
        paddingBottom: "calc(78px + env(safe-area-inset-bottom) + 16px)",
      }}
    >
      <div
        className="mx-auto w-full px-5 sm:px-8"
        style={{ maxWidth: "var(--page-max)", paddingTop: 24, paddingBottom: 32 }}
      >
        <header className="flex items-center justify-between" style={{ gap: 12 }}>
          <Link
            href={`/${locale}/today`}
            className="inline-flex min-h-11 items-center"
            style={{
              gap: 6,
              padding: "8px 12px",
              borderRadius: "var(--r-pill)",
              background: "var(--surface)",
              boxShadow: "inset 0 0 0 1px var(--line)",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <Glyph.back size={16} />
            {todayLabel}
          </Link>
          <div className="flex items-center gap-2">
            <Pill variant="live">{liveLabel}</Pill>
            <HeaderBell unreadCount={unread} locale={locale} />
          </div>
        </header>

        <div style={{ marginTop: 24 }}>
          <span
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--ink-muted)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </span>
          <h1
            className="display mt-2"
            style={{
              fontSize: "clamp(36px, 6vw, 56px)",
              letterSpacing: "-0.035em",
              lineHeight: 1.02,
            }}
          >
            {heading}
          </h1>
          <p
            className="mt-3 max-w-xl"
            style={{ fontSize: 15, color: "var(--ink-muted)", lineHeight: 1.5 }}
          >
            {intro}
          </p>
        </div>

        {data.rows.length === 0 ? (
          <Card variant="card" className="mt-6" style={{ padding: 0 }}>
            <EmptyState
              title={emptyTitle}
              body={emptyBody}
              glyph={<Glyph.pulse size={28} />}
              action={{ label: ctaLabel, href: `/${locale}/today` }}
            />
          </Card>
        ) : (
          <Card
            variant="card"
            className="mt-6"
            style={{ padding: 0, overflow: "hidden" }}
          >
            <div
              role="row"
              className="grid items-center sticky"
              style={{
                gridTemplateColumns: "60px 1fr 90px",
                padding: "12px 18px",
                fontSize: 11,
                color: "var(--ink-muted)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                borderBottom: "1px solid var(--line)",
                background: "var(--surface)",
                top: 0,
                zIndex: 1,
              }}
            >
              <span className="mono">{headerRank}</span>
              <span className="mono">{headerPlayer}</span>
              <span className="mono" style={{ textAlign: "right" }}>
                {headerPoints}
              </span>
            </div>
            {data.rows.map((row, i) => (
              <Row
                key={row.userId}
                row={row}
                isLast={i === data.rows.length - 1 && !viewerOutOfList}
                highlight={data.viewer?.userId === row.userId}
                pointsLabel={headerPoints}
                streakLabel={streakLabel}
                attendedLabel={attendedLabel}
              />
            ))}
            {viewerOutOfList && data.viewer ? (
              <div
                role="row"
                className="grid items-center"
                style={{
                  gridTemplateColumns: "60px 1fr 90px",
                  padding: "14px 18px",
                  borderTop: "1px dashed var(--line)",
                  background: "var(--accent-tint)",
                }}
              >
                <span
                  className="mono"
                  style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-muted)" }}
                >
                  #{data.viewer.rank}
                </span>
                <span className="flex items-center" style={{ gap: 12, minWidth: 0 }}>
                  <Avatar
                    name={data.viewer.row.fullName || data.viewer.row.username}
                    size={36}
                  />
                  <span style={{ minWidth: 0 }}>
                    <span
                      className="block truncate"
                      style={{ fontWeight: 600, fontSize: 15 }}
                    >
                      {youLabel} · {data.viewer.row.fullName || data.viewer.row.username}
                    </span>
                    <span
                      className="mono"
                      style={{ fontSize: 11, color: "var(--ink-muted)" }}
                    >
                      @{data.viewer.row.username} · {data.viewer.row.attendedCount}{" "}
                      {attendedLabel} · {data.viewer.row.streak} {streakLabel}
                    </span>
                  </span>
                </span>
                <span
                  className="mono"
                  style={{ textAlign: "right", fontSize: 15, fontWeight: 700 }}
                >
                  {data.viewer.row.points.toLocaleString()}
                </span>
              </div>
            ) : null}
          </Card>
        )}
      </div>

      <DesktopSidebar unreadCount={unread} />
      <MobileTabBar />
    </main>
  );
}
