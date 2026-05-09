import { eq } from "drizzle-orm";
import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HeaderBell } from "@/components/layout/HeaderBell";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { InlineEditPanels } from "@/components/settings/InlineEditPanels";
import { SettingsSection } from "@/components/settings/SettingsSection";
import {
  SettingsTabs,
  type SettingsSectionId,
} from "@/components/settings/SettingsTabs";
import { Glyph } from "@/components/ui/Glyph";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import type { AppLocale } from "@/i18n/routing";
import { getOnboardingUserState } from "@/lib/onboarding-state";
import type { SportKey } from "@/lib/sports";

export const dynamic = "force-dynamic";

const SECTION_IDS: ReadonlyArray<SettingsSectionId> = [
  "profile",
  "sports",
  "location",
  "privacy",
  "reminders",
  "integrations",
];

const COPY = {
  en: {
    eyebrow: "Settings",
    title: "Settings",
    subtitle: "Profile, sports, location, privacy, reminders.",
    tabs: {
      profile: "Profile",
      sports: "Sports",
      location: "Location",
      privacy: "Privacy",
      reminders: "Reminders",
      integrations: "Integrations",
    },
    profile: {
      title: "Profile",
      body: "How other players see you.",
    },
    sports: {
      title: "Sports",
      body: "Pick the sports you play and your level.",
    },
    location: {
      title: "Location",
      body: "City and how far you'll travel. We never store your exact home address.",
    },
    privacy: {
      title: "Privacy",
      body: "Decide what others can see.",
    },
    reminders: {
      title: "Reminders",
      body: "We'll nudge you about prompts and events.",
      email: "Email reminders coming soon",
      emailBody: "We'll surface this once Resend is wired in.",
    },
    integrations: {
      title: "Integrations",
      body: "Connect external services.",
      strava: "Connect Strava",
      stravaBody: "Strava OAuth/import is on the bonus track. Coming soon.",
      stravaCta: "Coming soon",
    },
    panel: {
      edit: "Edit",
      cancel: "Cancel",
      save: "Save",
      saving: "Saving…",
      saved: "Saved.",
      errorGeneric: "Something went wrong. Try again.",
      fullNameLabel: "Display name",
      bioLabel: "Short bio",
      noBio: "Add a bio so captains can form better groups.",
      fullNameRequired: "Enter your full name to continue.",
      bioRequired: "Add a short bio before saving.",
      bioCharsLeft: (n: number) => `${n} characters left`,
      sportsEmpty: "No sports selected yet.",
      sportsHint: "Tap Edit to update what you play and your level.",
      sportsRequired: "Pick at least one sport.",
      sportsLevel: (n: number) => `Level ${n}/5`,
      cityLabel: "City",
      latLabel: "Latitude",
      lngLabel: "Longitude",
      distanceLabel: "Travel radius",
      cityRequired: "Enter your city.",
      invalidLatitude: "Latitude must be between -90 and 90.",
      invalidLongitude: "Longitude must be between -180 and 180.",
      kmSuffix: "km",
      visibilityLabel: "Profile visibility",
      publicLabel: "Public",
      privateLabel: "Private",
      publicHint: "Anyone with your username link can see your public profile.",
      privateHint: "Only members of your groups can see your profile.",
      approxLocationBody:
        "We always round and jitter your home - it never appears precisely on the map.",
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
    back: "Back",
    backToToday: "Back to Today",
  },
  ro: {
    eyebrow: "Setări",
    title: "Setări",
    subtitle: "Profil, sporturi, locație, confidențialitate, reminder-e.",
    tabs: {
      profile: "Profil",
      sports: "Sporturi",
      location: "Locație",
      privacy: "Confidențialitate",
      reminders: "Reminder-e",
      integrations: "Integrări",
    },
    profile: {
      title: "Profil",
      body: "Cum te văd ceilalți jucători.",
    },
    sports: {
      title: "Sporturi",
      body: "Alege sporturile pe care le joci și nivelul tău.",
    },
    location: {
      title: "Locație",
      body: "Oraș și raza de călătorie. Nu salvăm niciodată adresa exactă.",
    },
    privacy: {
      title: "Confidențialitate",
      body: "Decide ce văd ceilalți.",
    },
    reminders: {
      title: "Reminder-e",
      body: "Te avertizăm despre prompt și evenimente.",
      email: "Reminder pe email curând",
      emailBody: "Apare odată ce Resend este conectat.",
    },
    integrations: {
      title: "Integrări",
      body: "Conectează servicii externe.",
      strava: "Conectează Strava",
      stravaBody: "OAuth/import Strava este pe traseul bonus. În curând.",
      stravaCta: "În curând",
    },
    panel: {
      edit: "Editează",
      cancel: "Renunță",
      save: "Salvează",
      saving: "Se salvează…",
      saved: "Salvat.",
      errorGeneric: "Ceva nu a mers. Încearcă din nou.",
      fullNameLabel: "Nume afișat",
      bioLabel: "Bio scurt",
      noBio: "Adaugă un bio ca să formăm grupuri mai bune.",
      fullNameRequired: "Introdu numele complet.",
      bioRequired: "Adaugă un bio scurt înainte de a salva.",
      bioCharsLeft: (n: number) => `${n} caractere rămase`,
      sportsEmpty: "Niciun sport selectat încă.",
      sportsHint: "Apasă Editează pentru a actualiza sporturile și nivelul.",
      sportsRequired: "Alege cel puțin un sport.",
      sportsLevel: (n: number) => `Nivel ${n}/5`,
      cityLabel: "Oraș",
      latLabel: "Latitudine",
      lngLabel: "Longitudine",
      distanceLabel: "Raza",
      cityRequired: "Introdu orașul.",
      invalidLatitude: "Latitudinea trebuie să fie între -90 și 90.",
      invalidLongitude: "Longitudinea trebuie să fie între -180 și 180.",
      kmSuffix: "km",
      visibilityLabel: "Vizibilitate profil",
      publicLabel: "Public",
      privateLabel: "Privat",
      publicHint: "Oricine cu linkul tău de username îți vede profilul public.",
      privateHint: "Doar membrii grupurilor tale îți văd profilul.",
      approxLocationBody:
        "Locația ta de acasă este mereu rotunjită - nu apare niciodată exact.",
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
    back: "Înapoi",
    backToToday: "Înapoi la Today",
  },
};

function readSection(
  value: string | string[] | undefined,
): SettingsSectionId {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw && SECTION_IDS.includes(raw as SettingsSectionId)) {
    return raw as SettingsSectionId;
  }
  return "profile";
}

export default async function SettingsPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: AppLocale }>;
  searchParams: Promise<{ section?: string | string[] }>;
}>) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const user = await getOnboardingUserState();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  const [visibilityRow] = await getDb()
    .select({ profileVisibility: users.profileVisibility })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  const isPublic = (visibilityRow?.profileVisibility ?? "public") === "public";

  const copy = COPY[locale];
  const section = readSection(sp.section);

  const sectionDefs: ReadonlyArray<{
    id: SettingsSectionId;
    label: string;
  }> = [
    { id: "profile", label: copy.tabs.profile },
    { id: "sports", label: copy.tabs.sports },
    { id: "location", label: copy.tabs.location },
    { id: "privacy", label: copy.tabs.privacy },
    { id: "reminders", label: copy.tabs.reminders },
    { id: "integrations", label: copy.tabs.integrations },
  ];

  const editableSection: "profile" | "sports" | "location" | "privacy" | null =
    section === "profile" ||
    section === "sports" ||
    section === "location" ||
    section === "privacy"
      ? section
      : null;

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
          href={`/${locale}/today`}
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
        <HeaderBell unreadCount={0} locale={locale} />
      </header>

      <SettingsTabs sections={sectionDefs} current={section} />

      <div className="mx-auto w-full max-w-5xl px-5 pt-4 md:grid md:grid-cols-[220px_1fr] md:gap-8 md:pt-10">
        <aside className="hidden md:block">
          <header className="px-2 pb-3">
            <h1
              className="display"
              style={{ fontSize: 24, lineHeight: 1.05, color: "var(--ink)" }}
            >
              {copy.title}
            </h1>
            <p
              className="mt-1 text-[12px]"
              style={{ color: "var(--ink-muted)", lineHeight: 1.5 }}
            >
              {copy.subtitle}
            </p>
          </header>
        </aside>

        <div className="flex flex-col gap-4 md:gap-5">
          {editableSection ? (
            <InlineEditPanels
              section={editableSection}
              initial={{
                fullName: user.fullName,
                bio: user.bio,
                city: user.city,
                homeLat: user.homeLat,
                homeLng: user.homeLng,
                maxDistanceKm: user.maxDistanceKm,
                sports: user.sports,
                isPublic,
              }}
              copy={copy.panel}
              sectionTitles={{
                profile: copy.profile,
                sports: copy.sports,
                location: copy.location,
                privacy: copy.privacy,
              }}
            />
          ) : null}

          {section === "reminders" ? (
            <SettingsSection
              title={copy.reminders.title}
              description={copy.reminders.body}
            >
              <div
                className="flex items-start gap-3 rounded-md p-3"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--line)",
                }}
              >
                <Glyph.bell size={16} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold">
                    {copy.reminders.email}
                  </div>
                  <div
                    className="mt-0.5 text-[12px]"
                    style={{ color: "var(--ink-muted)", lineHeight: 1.5 }}
                  >
                    {copy.reminders.emailBody}
                  </div>
                </div>
              </div>
            </SettingsSection>
          ) : null}

          {section === "integrations" ? (
            <SettingsSection
              title={copy.integrations.title}
              description={copy.integrations.body}
            >
              <div
                className="flex items-center gap-3 rounded-md p-3"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--line)",
                  opacity: 0.7,
                }}
              >
                <span
                  aria-hidden
                  className="grid place-items-center"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: "var(--surface)",
                    color: "var(--ink-muted)",
                    border: "1px solid var(--line)",
                  }}
                >
                  <Glyph.pulse size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[13px] font-semibold"
                    style={{ color: "var(--ink)" }}
                  >
                    {copy.integrations.strava}
                  </div>
                  <div
                    className="mt-0.5 text-[12px]"
                    style={{ color: "var(--ink-muted)", lineHeight: 1.5 }}
                  >
                    {copy.integrations.stravaBody}
                  </div>
                </div>
                <button
                  type="button"
                  disabled
                  className="btn-s2m btn-secondary"
                  style={{
                    minHeight: 36,
                    padding: "6px 12px",
                    fontSize: 12,
                    cursor: "not-allowed",
                  }}
                >
                  {copy.integrations.stravaCta}
                </button>
              </div>
            </SettingsSection>
          ) : null}

          <div className="mt-2 hidden md:flex">
            <Link
              href={`/${locale}/today`}
              className="btn-s2m btn-secondary"
              style={{ minHeight: 40, padding: "8px 14px", fontSize: 13 }}
            >
              <Glyph.back size={16} />
              {copy.backToToday}
            </Link>
          </div>
        </div>
      </div>

      <MobileTabBar />
    </main>
  );
}
