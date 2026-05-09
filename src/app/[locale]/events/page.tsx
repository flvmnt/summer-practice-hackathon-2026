import { and, desc, eq, inArray } from "drizzle-orm";
import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EventListItem, type RsvpStatusLite } from "@/components/events/EventListItem";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Glyph } from "@/components/ui/Glyph";
import { getDb } from "@/db";
import { eventAttendees, events } from "@/db/schema";
import type { AppLocale } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth-current-user";
import type { SportKey } from "@/lib/sports";

export const dynamic = "force-dynamic";

type Filter = "upcoming" | "past" | "all";

const COPY = {
  en: {
    title: "Your events",
    subtitle: "Upcoming and past events you're attending.",
    upcoming: "Upcoming",
    past: "Past",
    all: "All",
    create: "Create event",
    emptyTitle: "No events yet",
    emptyBody: "Create one or wait for today's match.",
    emptyAction: "Create event",
    rsvp: { going: "Going", maybe: "Maybe", declined: "Declined" },
  },
  ro: {
    title: "Evenimentele tale",
    subtitle: "Evenimente viitoare și trecute la care participi.",
    upcoming: "Viitoare",
    past: "Trecute",
    all: "Toate",
    create: "Creează eveniment",
    emptyTitle: "Niciun eveniment",
    emptyBody: "Creează unul sau așteaptă matchul de azi.",
    emptyAction: "Creează eveniment",
    rsvp: { going: "Vin", maybe: "Poate", declined: "Refuzat" },
  },
};

function readFilter(value: string | string[] | undefined): Filter {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "past" || raw === "all") return raw;
  return "upcoming";
}

/**
 * Lists events the current user is attending. Reads directly from Drizzle
 * — see TODO below for moving into a `getUserEventsList` action once a
 * dedicated lib helper exists.
 *
 * TODO(backend): introduce `getUserEventsList(filter)` in `src/lib/events.ts`
 * with proper ownership and demoRunId scoping, then swap the inline query.
 */
async function getUserEventsList(userId: string) {
  const db = getDb();
  const now = Date.now();

  const myAttendance = await db
    .select({
      eventId: eventAttendees.eventId,
      myStatus: eventAttendees.status,
    })
    .from(eventAttendees)
    .where(
      and(
        eq(eventAttendees.userId, userId),
        inArray(eventAttendees.status, ["going", "maybe", "declined"]),
      ),
    );

  if (myAttendance.length === 0) {
    return {
      items: [] as Array<{
        id: string;
        title: string;
        sport: SportKey;
        whenAt: Date;
        venueLabel: string | null;
        status: string;
        myStatus: RsvpStatusLite;
      }>,
      now,
    };
  }

  const eventIds = myAttendance.map((a) => a.eventId);
  const statusByEvent = new Map(
    myAttendance.map((a) => [a.eventId, a.myStatus as RsvpStatusLite]),
  );

  const eventRows = await db
    .select({
      id: events.id,
      title: events.title,
      sport: events.sport,
      whenAt: events.whenAt,
      customLocationText: events.customLocationText,
      status: events.status,
    })
    .from(events)
    .where(inArray(events.id, eventIds))
    .orderBy(desc(events.whenAt));

  return {
    items: eventRows.map((event) => ({
      id: event.id,
      title: event.title,
      sport: event.sport as SportKey,
      whenAt: event.whenAt,
      venueLabel: event.customLocationText,
      status: event.status,
      myStatus: statusByEvent.get(event.id) ?? ("unknown" as RsvpStatusLite),
    })),
    now,
  };
}

export default async function EventsPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: AppLocale }>;
  searchParams: Promise<{ filter?: string | string[] }>;
}>) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  const copy = COPY[locale];
  const filter = readFilter(sp.filter);
  const { items: all, now } = await getUserEventsList(user.id);
  const upcoming = all.filter((e) => e.whenAt.getTime() >= now);
  const past = all.filter((e) => e.whenAt.getTime() < now);
  const visible =
    filter === "upcoming" ? upcoming : filter === "past" ? past : all;

  const dateFmt = new Intl.DateTimeFormat(locale === "ro" ? "ro-RO" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Bucharest",
  });

  const filterChips: Array<{ id: Filter; label: string; count: number }> = [
    { id: "upcoming", label: copy.upcoming, count: upcoming.length },
    { id: "past", label: copy.past, count: past.length },
    { id: "all", label: copy.all, count: all.length },
  ];

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
            {locale === "ro" ? "Evenimente" : "Events"}
          </div>
          <h1
            className="display"
            style={{ fontSize: 26, lineHeight: 1.05, marginTop: 2 }}
          >
            {copy.title}
          </h1>
        </div>
        <Link
          href={`/${locale}/events/new`}
          className="grid place-items-center"
          aria-label={copy.create}
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            background: "var(--accent)",
            color: "var(--on-accent, #fff)",
          }}
        >
          <Glyph.plus size={18} />
        </Link>
      </header>

      <div className="mx-auto w-full max-w-3xl px-5 pt-4 md:pt-10">
        <header className="mb-6 hidden items-center justify-between md:flex">
          <div>
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
          </div>
          <Link
            href={`/${locale}/events/new`}
            className="btn-s2m"
            style={{ minHeight: 44, padding: "10px 16px", fontSize: 14 }}
          >
            <Glyph.plus size={16} />
            {copy.create}
          </Link>
        </header>

        {/* Filter chips */}
        <div className="mb-4 flex flex-wrap gap-2">
          {filterChips.map((chip) => {
            const active = chip.id === filter;
            return (
              <Link
                key={chip.id}
                href={
                  chip.id === "upcoming"
                    ? `/${locale}/events`
                    : `/${locale}/events?filter=${chip.id}`
                }
                aria-current={active ? "page" : undefined}
                style={{
                  padding: "6px 12px",
                  minHeight: 32,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                  background: active ? "var(--accent-soft)" : "var(--surface)",
                  color: active ? "var(--accent-deep)" : "var(--ink-muted)",
                  border: active
                    ? "1px solid color-mix(in oklch, var(--accent) 30%, transparent)"
                    : "1px solid var(--line)",
                  textDecoration: "none",
                }}
              >
                {chip.label}
                <span
                  className="mono"
                  style={{ fontSize: 10, opacity: 0.7, fontWeight: 700 }}
                >
                  {chip.count}
                </span>
              </Link>
            );
          })}
        </div>

        {visible.length === 0 ? (
          <EmptyState
            glyph={<Glyph.cal size={28} />}
            title={copy.emptyTitle}
            body={copy.emptyBody}
            action={{
              label: copy.emptyAction,
              href: `/${locale}/events/new`,
            }}
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {visible.map((event) => (
              <li key={event.id}>
                <EventListItem
                  href={`/${locale}/events/${event.id}`}
                  title={event.title}
                  sport={event.sport}
                  whenLabel={dateFmt.format(event.whenAt)}
                  venueLabel={event.venueLabel}
                  rsvp={event.myStatus}
                  rsvpLabels={copy.rsvp}
                  past={event.whenAt.getTime() < now}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <MobileTabBar />
    </main>
  );
}
