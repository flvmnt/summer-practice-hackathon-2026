import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { SettingsSection } from "@/components/settings/SettingsSection";
import {
  SettingsTabs,
  type SettingsSectionId,
} from "@/components/settings/SettingsTabs";
import { Glyph } from "@/components/ui/Glyph";
import { Pill } from "@/components/ui/Pill";
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
      fullNameLabel: "Display name",
      bioLabel: "Short bio",
      noBio: "Add a bio in onboarding to help captains form better groups.",
      editHint:
        "Profile editing here is coming soon. Update via onboarding for now.",
      goToOnboarding: "Edit in onboarding",
    },
    sports: {
      title: "Sports",
      body: "Pick up to six sports and your level.",
      empty: "No sports selected yet.",
      editHint:
        "Inline editing here is coming soon. Update sports via onboarding for now.",
      goToSports: "Edit sports",
      level: (n: number) => `Level ${n}/5`,
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
    location: {
      title: "Location",
      body: "City and how far you'll travel. We never store your exact home address.",
      cityLabel: "City",
      distanceLabel: "Travel radius",
      kmSuffix: "km",
      editHint:
        "Inline editing here is coming soon. Update location via onboarding for now.",
      goToLocation: "Edit location",
    },
    privacy: {
      title: "Privacy",
      body: "Decide what others can see.",
      visibilityLabel: "Profile visibility",
      public: "Public — anyone with the username link",
      private: "Private — only members of your groups",
      approxLocation: "Show approximate home location only",
      approxLocationBody:
        "We always round and jitter your home — it never appears precisely on the map.",
      alwaysOn: "Always on",
      comingSoon: "Toggling visibility from here is coming soon.",
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
      fullNameLabel: "Nume afișat",
      bioLabel: "Bio scurt",
      noBio: "Adaugă un bio în onboarding pentru grupuri mai bune.",
      editHint: "Editarea profilului aici vine curând. Folosește onboarding.",
      goToOnboarding: "Editează în onboarding",
    },
    sports: {
      title: "Sporturi",
      body: "Alege până la șase sporturi și nivelul tău.",
      empty: "Niciun sport selectat încă.",
      editHint:
        "Editarea inline vine curând. Folosește onboarding pentru a edita.",
      goToSports: "Editează sporturile",
      level: (n: number) => `Nivel ${n}/5`,
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
    location: {
      title: "Locație",
      body: "Oraș și raza de călătorie. Nu salvăm niciodată adresa exactă.",
      cityLabel: "Oraș",
      distanceLabel: "Raza",
      kmSuffix: "km",
      editHint:
        "Editare inline vine curând. Folosește onboarding pentru a edita.",
      goToLocation: "Editează locația",
    },
    privacy: {
      title: "Confidențialitate",
      body: "Decide ce văd ceilalți.",
      visibilityLabel: "Vizibilitate profil",
      public: "Public — oricine cu linkul",
      private: "Privat — doar membri din grupurile tale",
      approxLocation: "Doar locație aproximativă",
      approxLocationBody:
        "Locația ta de acasă este mereu rotunjită — nu apare niciodată exact.",
      alwaysOn: "Mereu activ",
      comingSoon: "Comutarea vizibilității aici vine curând.",
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

  return (
    <main
      className="relative min-h-screen w-full"
      style={{
        background: "var(--surface-2)",
        color: "var(--ink)",
        paddingBottom: "calc(78px + env(safe-area-inset-bottom))",
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
          {section === "profile" ? (
            <SettingsSection
              title={copy.profile.title}
              description={copy.profile.body}
            >
              <div className="flex flex-col gap-2">
                <Field
                  label={copy.profile.fullNameLabel}
                  value={user.fullName}
                />
                <Field
                  label={copy.profile.bioLabel}
                  value={user.bio ?? copy.profile.noBio}
                  muted={!user.bio}
                />
              </div>
              <p
                className="text-[12px]"
                style={{ color: "var(--ink-muted)", lineHeight: 1.5 }}
              >
                {copy.profile.editHint}
              </p>
              <Link
                href={`/${locale}/onboarding/profile`}
                className="btn-s2m btn-secondary self-start"
                style={{ minHeight: 40, padding: "8px 14px", fontSize: 13 }}
              >
                {copy.profile.goToOnboarding}
              </Link>
            </SettingsSection>
          ) : null}

          {section === "sports" ? (
            <SettingsSection
              title={copy.sports.title}
              description={copy.sports.body}
            >
              {user.sports.length === 0 ? (
                <p
                  className="text-[13px]"
                  style={{ color: "var(--ink-muted)" }}
                >
                  {copy.sports.empty}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {user.sports.map((s) => (
                    <Pill key={s.sport} variant="field">
                      {copy.sports.sportLabels[s.sport] ?? s.sport}
                      <span
                        className="mono"
                        style={{
                          marginLeft: 4,
                          fontSize: 10,
                          opacity: 0.7,
                          fontWeight: 700,
                        }}
                      >
                        {copy.sports.level(s.level)}
                      </span>
                    </Pill>
                  ))}
                </div>
              )}
              <p
                className="text-[12px]"
                style={{ color: "var(--ink-muted)", lineHeight: 1.5 }}
              >
                {copy.sports.editHint}
              </p>
              <Link
                href={`/${locale}/onboarding/sports`}
                className="btn-s2m btn-secondary self-start"
                style={{ minHeight: 40, padding: "8px 14px", fontSize: 13 }}
              >
                {copy.sports.goToSports}
              </Link>
            </SettingsSection>
          ) : null}

          {section === "location" ? (
            <SettingsSection
              title={copy.location.title}
              description={copy.location.body}
            >
              <div className="flex flex-col gap-2">
                <Field
                  label={copy.location.cityLabel}
                  value={user.city ?? "—"}
                  muted={!user.city}
                />
                <Field
                  label={copy.location.distanceLabel}
                  value={`${user.maxDistanceKm} ${copy.location.kmSuffix}`}
                />
              </div>
              <p
                className="text-[12px]"
                style={{ color: "var(--ink-muted)", lineHeight: 1.5 }}
              >
                {copy.location.editHint}
              </p>
              <Link
                href={`/${locale}/onboarding/location`}
                className="btn-s2m btn-secondary self-start"
                style={{ minHeight: 40, padding: "8px 14px", fontSize: 13 }}
              >
                {copy.location.goToLocation}
              </Link>
            </SettingsSection>
          ) : null}

          {section === "privacy" ? (
            <SettingsSection
              title={copy.privacy.title}
              description={copy.privacy.body}
            >
              <div className="flex flex-col gap-2">
                <Field
                  label={copy.privacy.visibilityLabel}
                  value={copy.privacy.public}
                />
              </div>
              <div
                className="flex items-start gap-3 rounded-md p-3"
                style={{
                  background: "var(--field-soft)",
                  color: "var(--field)",
                  border: "1px solid color-mix(in oklch, var(--field) 25%, transparent)",
                }}
              >
                <Glyph.shield size={16} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold">
                    {copy.privacy.approxLocation}
                  </div>
                  <div
                    className="mt-0.5 text-[12px]"
                    style={{ lineHeight: 1.5, opacity: 0.85 }}
                  >
                    {copy.privacy.approxLocationBody}
                  </div>
                </div>
                <Pill variant="field">{copy.privacy.alwaysOn}</Pill>
              </div>
              <p
                className="text-[12px]"
                style={{ color: "var(--ink-muted)", lineHeight: 1.5 }}
              >
                {copy.privacy.comingSoon}
              </p>
            </SettingsSection>
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

function Field({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div
      className="flex flex-col gap-1 rounded-md p-3"
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--line)",
      }}
    >
      <span
        className="mono text-[10px] font-bold uppercase tracking-[0.12em]"
        style={{ color: "var(--ink-muted)" }}
      >
        {label}
      </span>
      <span
        className="text-[14px]"
        style={{
          color: muted ? "var(--ink-muted)" : "var(--ink)",
          lineHeight: 1.4,
          fontWeight: 600,
        }}
      >
        {value}
      </span>
    </div>
  );
}
