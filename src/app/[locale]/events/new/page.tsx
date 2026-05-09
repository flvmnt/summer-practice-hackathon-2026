import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateEventForm } from "@/components/events/CreateEventForm";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { Glyph } from "@/components/ui/Glyph";
import type { AppLocale } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth-current-user";
import { SPORT_KEYS, type SportKey } from "@/lib/sports";

export const dynamic = "force-dynamic";

const COPY = {
  en: {
    eyebrow: "Create",
    title: "Create event",
    subtitle: "Set up a public pickup before today's match.",
    sportLabel: "Sport",
    timeLabel: "When",
    venueLabel: "Venue",
    venueSearch: "Search venues",
    suggestedVenues: "Suggested nearby",
    selectedVenue: "Selected venue",
    submit: "Create event",
    comingSoon:
      "Manual event creation is coming soon. Captains can create group-linked events from the group plan.",
    note: "Pre-matching, this route only allows creating manual public events with limited features.",
    back: "Back",
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
    subtitle: "Pregătește un meci public înainte de matchul de azi.",
    sportLabel: "Sport",
    timeLabel: "Când",
    venueLabel: "Locație",
    venueSearch: "Caută locații",
    suggestedVenues: "Sugerate în apropiere",
    selectedVenue: "Locație selectată",
    submit: "Creează eveniment",
    comingSoon:
      "Crearea manuală de evenimente vine în curând. Căpitanii pot crea evenimente din planul grupului.",
    note: "Înainte de match, această rută permite doar evenimente publice manuale cu funcții limitate.",
    back: "Înapoi",
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
  // Ensure all SPORT_KEYS have labels (defensive — keeps form happy if a new
  // sport is added later).
  const sportLabels = SPORT_KEYS.reduce<Record<SportKey, string>>(
    (acc, key) => {
      acc[key] = copy.sportLabels[key] ?? key;
      return acc;
    },
    {} as Record<SportKey, string>,
  );

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
        className="flex items-center gap-3 px-5 pt-6 md:hidden"
        style={{}}
      >
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

        <div
          className="p-5"
          style={{
            background: "var(--surface)",
            borderRadius: "var(--r-card)",
            border: "1px solid var(--line)",
            boxShadow: "var(--shadow-1)",
          }}
        >
          <CreateEventForm
            copy={{
              sportLabel: copy.sportLabel,
              timeLabel: copy.timeLabel,
              venueLabel: copy.venueLabel,
              venueSearch: copy.venueSearch,
              suggestedVenues: copy.suggestedVenues,
              selectedVenue: copy.selectedVenue,
              submit: copy.submit,
              comingSoon: copy.comingSoon,
              sportLabels,
            }}
          />
        </div>
      </div>

      <MobileTabBar />
    </main>
  );
}
