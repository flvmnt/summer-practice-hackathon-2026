import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { CaptainBriefPanel } from "@/components/group/CaptainBriefPanel";
import { CreateGroupEventForm } from "@/components/group/CreateGroupEventForm";
import { FormationTimeline } from "@/components/group/FormationTimeline";
import { GroupChatForm } from "@/components/group/GroupChatForm";
import { GroupHeader } from "@/components/group/GroupHeader";
import { GroupMembersList } from "@/components/group/GroupMembersList";
import { GroupTabs, type GroupTabId } from "@/components/group/GroupTabs";
import { TeamBalancePanel } from "@/components/group/TeamBalancePanel";
import { HeaderBell } from "@/components/layout/HeaderBell";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { Card } from "@/components/ui/Card";
import { Glyph } from "@/components/ui/Glyph";
import { Pill } from "@/components/ui/Pill";
import type { AppLocale } from "@/i18n/routing";
import { getGroupAction } from "@/lib/chat";
import { SPORTS, type SportKey } from "@/lib/sports";

export const dynamic = "force-dynamic";

type SearchParams = { tab?: string | string[] };

function readTab(value: string | string[] | undefined): GroupTabId {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "chat" || raw === "players") return raw;
  return "plan";
}

export default async function GroupPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: AppLocale; groupId: string }>;
  searchParams: Promise<SearchParams>;
}>) {
  const { locale, groupId } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("group");
  const groupResult = await getGroupAction({ groupId });

  if (!groupResult.ok) {
    redirect(`/${locale}/today`);
  }

  const group = groupResult.data.group;
  const members = groupResult.data.members;
  const captain = members.find((member) => member.userId === group.captainUserId);
  const isCaptain = groupResult.data.currentUserId === group.captainUserId;
  const showTeamBalance = SPORTS[group.sport].evenTeams && members.length >= 2;
  const sportLabel = t(`sports.${group.sport as SportKey}`);
  const currentTab = readTab(sp.tab);
  const events = groupResult.data.events;
  const upcomingEvent = events[0] ?? null;
  const hasFirstMatch = groupResult.data.achievements.some(
    (achievement) => achievement.code === "first_match",
  );

  // Confirmation status counts. Shape stays stable when statuses widen later.
  const confirmedMembers = members.filter((m) => m.status === "confirmed");
  const maybeMembers = members.filter((m) => m.status === "maybe");
  const noMembers = members.filter(
    (m) => m.status !== "confirmed" && m.status !== "maybe",
  );

  const briefMembers = members.map((m) => ({
    id: m.userId,
    name: m.fullName,
    status:
      m.status === "confirmed"
        ? ("confirmed" as const)
        : m.status === "maybe"
          ? ("pending" as const)
          : ("declined" as const),
  }));

  const formationReasons: Array<{
    icon?: ReactNode;
    label: string;
    value?: string;
  }> = [
    { icon: <Glyph.pin size={12} />, label: "Within distance gate", value: "5 km" },
    { icon: <Glyph.spark size={12} />, label: `Same sport · ${sportLabel}` },
    { icon: <Glyph.pulse size={12} />, label: "Skill mix balanced" },
    { icon: <Glyph.groups size={12} />, label: "Group size fit" },
  ];

  const eventDateLabel = upcomingEvent
    ? new Intl.DateTimeFormat(locale === "ro" ? "ro-RO" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Europe/Bucharest",
      }).format(new Date(upcomingEvent.whenAt))
    : null;

  const membersCopy = {
    captainBadge: t("captainBadge"),
    playerBadge: t("playerBadge"),
    statusConfirmed: "Confirmed",
    statusMaybe: "Maybe",
    statusPending: "Pending",
  };

  const formCopy = t.raw("form") as {
    messagePlaceholder: string;
    send: string;
    sending: string;
    genericError: string;
  };
  const chatCopy = {
    ...formCopy,
    emptyTitle: t("emptyChat"),
    emptyBody: "Say where and when works for you.",
  };

  /* ------------------ shared section renderers ------------------ */

  const planSection = (
    <div className="flex flex-col gap-3 px-4 py-4 md:p-0">
      {hasFirstMatch ? (
        <Card className="flex items-start gap-3 p-4" variant="card">
          <span
            aria-hidden
            className="grid h-9 w-9 place-items-center"
            style={{
              background: "var(--accent-soft)",
              color: "var(--accent-deep)",
              borderRadius: 10,
              flex: "none",
            }}
          >
            <Glyph.check size={18} />
          </span>
          <div>
            <p className="text-sm font-bold">{t("achievement.firstMatchTitle")}</p>
            <p
              className="mt-1 text-[13px] leading-snug"
              style={{ color: "var(--ink-muted)" }}
            >
              {t("achievement.firstMatchBody")}
            </p>
          </div>
        </Card>
      ) : null}

      {isCaptain ? (
        <CaptainBriefPanel
          members={briefMembers}
          suggestedVenue={
            upcomingEvent?.title
              ? { name: upcomingEvent.title }
              : { name: "Pick a venue", sub: "Tap to suggest" }
          }
          suggestedTime={eventDateLabel}
          weather={null}
        />
      ) : null}

      <FormationTimeline reasons={formationReasons} title="Why this group?" />

      <Card variant="card" className="flex flex-col gap-3 p-4">
        <header className="flex items-center gap-2">
          <span
            aria-hidden
            className="grid h-7 w-7 place-items-center"
            style={{
              background: "var(--accent-soft)",
              color: "var(--accent-deep)",
              borderRadius: 8,
            }}
          >
            <Glyph.cal size={16} />
          </span>
          <h2
            className="display"
            style={{ fontSize: 16, lineHeight: 1.15, color: "var(--ink)" }}
          >
            {t("planTitle")}
          </h2>
        </header>

        {upcomingEvent ? (
          <EventProposalRow
            href={`/${locale}/events/${upcomingEvent.id}`}
            label={eventDateLabel}
            confirmed={confirmedMembers.length}
            maybe={maybeMembers.length}
            no={noMembers.length}
          />
        ) : isCaptain ? (
          <CreateGroupEventForm
            copy={t.raw("eventForm")}
            groupId={group.id}
            locale={locale}
          />
        ) : (
          <p
            className="text-[13px] leading-snug"
            style={{ color: "var(--ink-muted)" }}
          >
            {t("noEvent")}
          </p>
        )}
      </Card>

      {showTeamBalance ? (
        <TeamBalancePanel
          canShuffle={isCaptain}
          copy={t.raw("teamBalance")}
          members={members}
        />
      ) : null}
    </div>
  );

  const chatSection = (
    <div
      className="flex flex-col"
      style={{ minHeight: "calc(100dvh - 110px)" }}
    >
      <GroupChatForm
        captainUserId={group.captainUserId}
        copy={chatCopy}
        currentUserId={groupResult.data.currentUserId}
        groupId={group.id}
        messages={groupResult.data.messages}
      />
    </div>
  );

  const playersSection = (
    <div className="flex flex-col gap-3 px-4 py-4 md:p-0">
      <GroupMembersList
        captainUserId={group.captainUserId}
        copy={membersCopy}
        members={members}
      />
    </div>
  );

  /* --------------------------- layout --------------------------- */

  return (
    <main
      className="min-h-screen has-mobile-tabbar"
      style={{ background: "var(--surface-2)" }}
    >
      {/* Mobile header - sticky so count + captain stay above the fold */}
      <div className="sticky top-0 z-10 md:hidden">
        <GroupHeader
          backHref={`/${locale}/today`}
          backLabel={t("back")}
          captainName={captain?.fullName ?? null}
          memberCount={members.length}
          sizeTarget={group.sizeTarget}
          sportLabel={sportLabel}
          rightSlot={<HeaderBell unreadCount={0} locale={locale} />}
        />
      </div>

      {/* Mobile: tabs */}
      <GroupTabs
        chat={chatSection}
        current={currentTab}
        labels={{ plan: "Plan", chat: "Chat", players: "Players" }}
        plan={planSection}
        players={playersSection}
      />

      {/* Desktop: 3-column shell */}
      <div className="hidden md:block">
        <div
          className="mx-auto grid w-full max-w-6xl gap-5 px-5 py-6"
          style={{ gridTemplateColumns: "0.75fr 1.25fr 0.85fr" }}
        >
          {/* Left: members + plan summary */}
          <Card
            as="section"
            className="flex flex-col gap-4 p-5"
            variant="card"
          >
            <Link
              className="btn-s2m btn-secondary self-start"
              href={`/${locale}/today`}
              style={{ minHeight: 40, padding: "8px 14px", fontSize: 13 }}
            >
              <Glyph.back size={16} />
              {t("back")}
            </Link>

            <header className="flex flex-col gap-1">
              <span
                className="mono text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ color: "var(--ink-muted)" }}
              >
                {sportLabel}
              </span>
              <h1
                className="display"
                style={{ fontSize: 26, lineHeight: 1.05, color: "var(--ink)" }}
              >
                {t("title", { sport: sportLabel })}
              </h1>
              <p
                className="mt-1 text-[13px] leading-snug"
                style={{ color: "var(--ink-muted)" }}
              >
                {t("summary", {
                  count: members.length,
                  target: group.sizeTarget,
                })}
              </p>
              {captain ? (
                <div className="mt-2">
                  <Pill icon={<Glyph.crown size={12} />} variant="accent">
                    {t("captain", { name: captain.fullName })}
                  </Pill>
                </div>
              ) : null}
              {hasFirstMatch ? (
                <div className="mt-2">
                  <Pill icon={<Glyph.check size={12} />} variant="field">
                    {t("achievement.firstMatchTitle")}
                  </Pill>
                </div>
              ) : null}
            </header>

            <h2
              className="mono text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ color: "var(--ink-muted)" }}
            >
              {t("playersTitle")}
            </h2>
            <GroupMembersList
              captainUserId={group.captainUserId}
              copy={membersCopy}
              members={members}
            />
          </Card>

          {/* Center: chat */}
          <Card
            as="section"
            className="flex flex-col overflow-hidden p-0"
            style={{ minHeight: "70vh" }}
            variant="card"
          >
            <header
              className="flex items-center gap-2 px-5 py-4"
              style={{ borderBottom: "1px solid var(--line)" }}
            >
              <Glyph.chat size={18} />
              <h2
                className="display"
                style={{ fontSize: 16, lineHeight: 1.1, color: "var(--ink)" }}
              >
                {t("chatTitle")}
              </h2>
            </header>
            <div className="min-h-0 flex-1">
              <GroupChatForm
                captainUserId={group.captainUserId}
                copy={chatCopy}
                currentUserId={groupResult.data.currentUserId}
                groupId={group.id}
                messages={groupResult.data.messages}
              />
            </div>
          </Card>

          {/* Right: event tools */}
          <Card
            as="section"
            className="flex flex-col gap-4 p-5"
            variant="card"
          >
            {isCaptain ? (
              <CaptainBriefPanel
                members={briefMembers}
                suggestedTime={eventDateLabel}
                suggestedVenue={
                  upcomingEvent?.title
                    ? { name: upcomingEvent.title }
                    : { name: "Pick a venue", sub: "Tap to suggest" }
                }
                weather={null}
              />
            ) : null}

            <FormationTimeline
              reasons={formationReasons}
              title="Why this group?"
            />

            <div className="flex flex-col gap-2">
              <h2
                className="mono text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ color: "var(--ink-muted)" }}
              >
                {t("planTitle")}
              </h2>
              {upcomingEvent ? (
                <EventProposalRow
                  confirmed={confirmedMembers.length}
                  href={`/${locale}/events/${upcomingEvent.id}`}
                  label={eventDateLabel}
                  maybe={maybeMembers.length}
                  no={noMembers.length}
                />
              ) : isCaptain ? (
                <CreateGroupEventForm
                  copy={t.raw("eventForm")}
                  groupId={group.id}
                  locale={locale}
                />
              ) : (
                <p
                  className="text-[13px] leading-snug"
                  style={{ color: "var(--ink-muted)" }}
                >
                  {t("noEvent")}
                </p>
              )}
            </div>

            {showTeamBalance ? (
              <TeamBalancePanel
                canShuffle={isCaptain}
                copy={t.raw("teamBalance")}
                members={members}
              />
            ) : null}
          </Card>
        </div>
      </div>

      <MobileTabBar />
    </main>
  );
}

function EventProposalRow({
  confirmed,
  href,
  label,
  maybe,
  no,
}: {
  confirmed: number;
  href: string;
  label: string | null;
  maybe: number;
  no: number;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Link
        className="flex items-center gap-2 rounded-[12px] px-3 py-2.5"
        href={href}
        style={{
          background: "var(--surface-2)",
          color: "var(--ink)",
          border: "1px solid var(--line)",
        }}
      >
        <Glyph.clock size={16} />
        <span className="text-[13px] font-semibold">
          {label ?? "Event proposed"}
        </span>
        <span
          aria-hidden
          className="ml-auto"
          style={{ color: "var(--ink-muted)" }}
        >
          <Glyph.chevron size={14} />
        </span>
      </Link>
      <div className="flex flex-wrap gap-2">
        <Link href={href}>
          <Pill icon={<Glyph.check size={12} />} variant="field">
            Going · {confirmed}
          </Pill>
        </Link>
        <Link href={href}>
          <Pill variant="alt">Maybe · {maybe}</Pill>
        </Link>
        <Link href={href}>
          <Pill variant="alt">No · {no}</Pill>
        </Link>
      </div>
    </div>
  );
}
