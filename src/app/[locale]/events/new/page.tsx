import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateGroupEventForm } from "@/components/group/CreateGroupEventForm";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Glyph } from "@/components/ui/Glyph";
import { Pill } from "@/components/ui/Pill";
import type { AppLocale } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth-current-user";
import { getCaptainGroups } from "@/lib/events";
import type { SportKey } from "@/lib/sports";

export const dynamic = "force-dynamic";

const COPY = {
  en: {
    eyebrow: "Create",
    title: "Create event",
    subtitle:
      "Pick a group you captain. We'll spin up an event with venue candidates and open a vote.",
    pickGroup: "Choose a group",
    captainOf: "Captain",
    sizeTarget: "target",
    note:
      "Manual public events are stretch. Today, captains create group-linked events here.",
    back: "Back",
    create: "Create event",
    creating: "Creating…",
    created: "Event created.",
    openEvent: "Open event",
    genericError: "Something went wrong. Try again.",
    emptyTitle: "You don't captain any groups yet",
    emptyBody:
      "Join a match on Today and you may be promoted to captain, or create a group from the Groups screen.",
    emptyAction: "Open Groups",
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
    eyebrow: "Creează",
    title: "Creează eveniment",
    subtitle:
      "Alege un grup în care ești căpitan. Pregătim evenimentul cu candidați și deschidem votul.",
    pickGroup: "Alege un grup",
    captainOf: "Căpitan",
    sizeTarget: "țintă",
    note:
      "Evenimentele publice manuale sunt opționale. Acum, căpitanii creează evenimente legate de grup aici.",
    back: "Înapoi",
    create: "Creează eveniment",
    creating: "Se creează…",
    created: "Eveniment creat.",
    openEvent: "Deschide evenimentul",
    genericError: "Ceva nu a funcționat. Încearcă din nou.",
    emptyTitle: "Nu ești căpitan în niciun grup",
    emptyBody:
      "Alătură-te unui match de pe Astăzi și poți fi promovat căpitan, sau creează un grup din ecranul Grupuri.",
    emptyAction: "Deschide Grupuri",
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

export default async function CreateEventPage({
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
  const captainGroups = await getCaptainGroups(user.id);

  return (
    <main
      className="relative min-h-screen w-full"
      style={{
        background: "var(--surface-2)",
        color: "var(--ink)",
        paddingBottom: "calc(78px + env(safe-area-inset-bottom) + 16px)",
      }}
    >
      <header className="flex items-center gap-3 px-5 pt-6 md:hidden">
        <Link
          href={`/${locale}/events`}
          aria-label={copy.back}
          className="grid place-items-center"
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            background: "var(--surface)",
            color: "var(--ink)",
            border: "1px solid var(--line)",
          }}
        >
          <Glyph.back size={16} />
        </Link>
        <div className="min-w-0 flex-1">
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--ink-muted)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {copy.eyebrow}
          </div>
          <h1
            className="display truncate"
            style={{ fontSize: 22, lineHeight: 1.1, marginTop: 2 }}
          >
            {copy.title}
          </h1>
        </div>
      </header>

      <div className="mx-auto w-full max-w-xl px-5 pt-4 md:pt-10">
        <div className="hidden md:block">
          <Link
            href={`/${locale}/events`}
            className="btn-s2m btn-secondary inline-flex"
            style={{ minHeight: 40, padding: "8px 14px", fontSize: 13 }}
          >
            <Glyph.back size={16} />
            {copy.back}
          </Link>
          <h1
            className="display mt-6"
            style={{ fontSize: 36, lineHeight: 1.05 }}
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

        <p
          className="mt-4 mb-5 rounded-md p-3 text-[12px]"
          style={{
            background: "var(--accent-tint)",
            color: "var(--ink-muted)",
            border:
              "1px solid color-mix(in oklch, var(--accent) 20%, transparent)",
            lineHeight: 1.5,
          }}
        >
          {copy.note}
        </p>

        {captainGroups.length === 0 ? (
          <Card variant="card" style={{ padding: 0 }}>
            <EmptyState
              glyph={<Glyph.groups size={28} />}
              title={copy.emptyTitle}
              body={copy.emptyBody}
              action={{
                label: copy.emptyAction,
                href: `/${locale}/groups`,
              }}
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            <div
              className="mono"
              style={{
                fontSize: 11,
                color: "var(--ink-muted)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              {copy.pickGroup}
            </div>
            {captainGroups.map((group) => (
              <Card
                key={group.id}
                variant="card"
                style={{ padding: 18 }}
              >
                <div
                  className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                  style={{ gap: 16 }}
                >
                  <div className="min-w-0">
                    <div
                      className="flex items-center"
                      style={{ gap: 8, marginBottom: 6 }}
                    >
                      <Pill variant="accent">{copy.captainOf}</Pill>
                      <span
                        className="mono"
                        style={{
                          fontSize: 11,
                          color: "var(--ink-muted)",
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                        }}
                      >
                        {copy.sportLabels[group.sport] ?? group.sport}
                      </span>
                    </div>
                    <h3
                      className="display truncate"
                      style={{
                        fontSize: 17,
                        letterSpacing: "-0.015em",
                        lineHeight: 1.2,
                      }}
                    >
                      {group.city ??
                        (locale === "ro" ? "Grupul tău" : "Your group")}
                    </h3>
                    <div
                      className="mt-1 flex items-center gap-3 text-[12px]"
                      style={{ color: "var(--ink-muted)" }}
                    >
                      <span className="inline-flex items-center" style={{ gap: 4 }}>
                        <Glyph.groups size={12} />
                        {group.sizeTarget} {copy.sizeTarget}
                      </span>
                    </div>
                  </div>
                  <div style={{ minWidth: 180 }}>
                    <CreateGroupEventForm
                      copy={{
                        create: copy.create,
                        creating: copy.creating,
                        created: copy.created,
                        openEvent: copy.openEvent,
                        genericError: copy.genericError,
                      }}
                      groupId={group.id}
                      locale={locale}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <MobileTabBar />
    </main>
  );
}
