import { CalendarDays, MessageSquareText, Trophy, UsersRound } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateGroupEventForm } from "@/components/group/CreateGroupEventForm";
import { GroupChatForm } from "@/components/group/GroupChatForm";
import type { AppLocale } from "@/i18n/routing";
import { getGroupAction } from "@/lib/chat";
import type { SportKey } from "@/lib/sports";

export const dynamic = "force-dynamic";

export default async function GroupPage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale; groupId: string }>;
}>) {
  const { locale, groupId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("group");
  const groupResult = await getGroupAction({ groupId });

  if (!groupResult.ok) {
    redirect(`/${locale}/today`);
  }

  const group = groupResult.data.group;
  const members = groupResult.data.members;
  const captain = members.find((member) => member.userId === group.captainUserId);

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-6xl gap-5 px-5 py-6 lg:grid-cols-[0.75fr_1.25fr_0.85fr]">
      <section className="rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-5 shadow-sm">
        <Link
          className="inline-flex min-h-11 items-center rounded-md border border-[var(--line)] bg-white px-3 text-sm font-semibold"
          href={`/${locale}/today`}
        >
          {t("back")}
        </Link>
        <div className="mt-6 flex size-11 items-center justify-center rounded-full bg-[var(--mint)] text-[var(--navy)]">
          <Trophy aria-hidden="true" size={22} />
        </div>
        <h1 className="mt-4 text-3xl font-bold">
          {t("title", { sport: t(`sports.${group.sport as SportKey}`) })}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          {t("summary", {
            count: members.length,
            target: group.sizeTarget,
          })}
        </p>
        {captain ? (
          <p className="mt-4 rounded-md bg-[var(--cloud)] px-3 py-2 text-sm font-semibold">
            {t("captain", { name: captain.fullName })}
          </p>
        ) : null}
        <div className="mt-6 rounded-md border border-[var(--line)] bg-white p-3">
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays aria-hidden="true" size={18} />
            <h2 className="text-sm font-bold">{t("planTitle")}</h2>
          </div>
          {groupResult.data.events.length > 0 ? (
            <ul className="grid gap-2">
              {groupResult.data.events.map((event) => (
                <li key={event.id}>
                  <Link
                    className="block rounded-md bg-[var(--cloud)] px-3 py-2 text-sm font-semibold"
                    href={`/${locale}/events/${event.id}`}
                  >
                    {t("eventListTitle", {
                      sport: t(`sports.${event.sport as SportKey}`),
                    })}
                  </Link>
                </li>
              ))}
            </ul>
          ) : groupResult.data.currentUserId === group.captainUserId ? (
            <CreateGroupEventForm
              copy={t.raw("eventForm")}
              groupId={group.id}
              locale={locale}
            />
          ) : (
            <p className="text-sm leading-6 text-[var(--muted)]">{t("noEvent")}</p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <MessageSquareText aria-hidden="true" size={22} />
          <h2 className="text-xl font-bold">{t("chatTitle")}</h2>
        </div>
        <div className="grid max-h-[52vh] min-h-64 gap-3 overflow-y-auto rounded-md bg-[var(--cloud)] p-3">
          {groupResult.data.messages.length > 0 ? (
            groupResult.data.messages.map((message) => (
              <article className="rounded-md bg-white p-3" key={message.id}>
                <p className="text-sm font-bold">
                  {message.user?.fullName ?? t("system")}
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  {message.body}
                </p>
              </article>
            ))
          ) : (
            <p className="self-center text-center text-sm font-semibold text-[var(--muted)]">
              {t("emptyChat")}
            </p>
          )}
        </div>
        <div className="mt-4">
          <GroupChatForm copy={t.raw("form")} groupId={group.id} />
        </div>
      </section>

      <section className="rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <UsersRound aria-hidden="true" size={22} />
          <h2 className="text-xl font-bold">{t("playersTitle")}</h2>
        </div>
        <ul className="grid gap-2">
          {members.map((member) => (
            <li
              className="rounded-md border border-[var(--line)] bg-white px-3 py-2"
              key={member.userId}
            >
              <span className="font-semibold">{member.fullName}</span>
              <span className="ml-2 text-sm text-[var(--muted)]">
                {member.role === "captain" ? t("captainBadge") : t("playerBadge")}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
