import { CalendarDays, MessageSquareText, UsersRound } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EventChatForm } from "@/components/event/EventChatForm";
import type { AppLocale } from "@/i18n/routing";
import { getEventAction } from "@/lib/chat";
import type { SportKey } from "@/lib/sports";

export const dynamic = "force-dynamic";

export default async function EventPage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale; eventId: string }>;
}>) {
  const { locale, eventId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("event");
  const result = await getEventAction({ eventId });

  if (!result.ok) {
    redirect(`/${locale}/today`);
  }

  const { event, attendees, messages } = result.data;
  const sportLabel = t(`sports.${event.sport as SportKey}`);
  const when = new Intl.DateTimeFormat(locale === "ro" ? "ro-RO" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Bucharest",
  }).format(new Date(event.whenAt));

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-6xl gap-5 px-5 py-6 lg:grid-cols-[0.85fr_1.2fr_0.9fr]">
      <section className="rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-5 shadow-sm">
        <Link
          className="inline-flex min-h-11 items-center rounded-md border border-[var(--line)] bg-white px-3 text-sm font-semibold"
          href={`/${locale}/groups/${event.groupId}`}
        >
          {t("back")}
        </Link>
        <div className="mt-6 flex size-11 items-center justify-center rounded-full bg-[var(--mint)] text-[var(--navy)]">
          <CalendarDays aria-hidden="true" size={22} />
        </div>
        <p className="mt-4 text-sm font-semibold text-[var(--muted)]">
          {sportLabel}
        </p>
        <h1 className="mt-2 text-3xl font-bold">{t("title", { sport: sportLabel })}</h1>
        <div className="mt-4 grid gap-2 text-sm leading-6 text-[var(--muted)]">
          <p>{t("when", { when })}</p>
          <p>{t("duration", { minutes: event.durationMin })}</p>
          <p>{event.customLocationText ?? t("venuePending")}</p>
          <p className="rounded-md bg-[var(--cloud)] px-3 py-2 font-semibold">
            {t("status", { status: t(`statuses.${event.status}`) })}
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <MessageSquareText aria-hidden="true" size={22} />
          <h2 className="text-xl font-bold">{t("chatTitle")}</h2>
        </div>
        <div className="grid max-h-[52vh] min-h-64 gap-3 overflow-y-auto rounded-md bg-[var(--cloud)] p-3">
          {messages.length > 0 ? (
            messages.map((message) => (
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
          <EventChatForm copy={t.raw("form")} eventId={event.id} />
        </div>
      </section>

      <section className="rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <UsersRound aria-hidden="true" size={22} />
          <h2 className="text-xl font-bold">{t("attendeesTitle")}</h2>
        </div>
        <ul className="grid gap-2">
          {attendees.map((attendee) => (
            <li
              className="rounded-md border border-[var(--line)] bg-white px-3 py-2"
              key={attendee.userId}
            >
              <span className="font-semibold">{attendee.fullName}</span>
              <span className="ml-2 text-sm text-[var(--muted)]">
                {t(`attendeeStatuses.${attendee.status}`)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
