import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HeaderBell } from "@/components/layout/HeaderBell";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { SetupBanner } from "@/components/onboarding/SetupBanner";
import { TodayPromptCard } from "@/components/today/TodayPromptCard";
import { Glyph } from "@/components/ui/Glyph";
import type { AppLocale } from "@/i18n/routing";
import { unreadCount } from "@/lib/notifications";
import { getOnboardingUserState } from "@/lib/onboarding-state";
import { getMyTodayStateAction } from "@/lib/prompt";

export const dynamic = "force-dynamic";

function firstName(fullName: string | null | undefined): string {
  if (!fullName) return "Player";
  return fullName.trim().split(/\s+/)[0] ?? "Player";
}

export default async function TodayPage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("today");
  const user = await getOnboardingUserState();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  if (!user.bio) {
    redirect(`/${locale}/onboarding/profile`);
  }

  if (user.sports.length === 0) {
    redirect(`/${locale}/onboarding/sports`);
  }

  if (!user.city || !user.homeLat || !user.homeLng) {
    redirect(`/${locale}/onboarding/location`);
  }

  const todayState = await getMyTodayStateAction();
  if (!todayState.ok) {
    redirect(`/${locale}/login`);
  }
  const unread = await unreadCount(user.id);

  // Required onboarding is complete; surface optional photo step as a setup
  // banner per spec (AGENTS.md UX rules).
  const requiredComplete = 3;
  const totalSteps = 4;
  // We don't have a photoUrl on the onboarding state - the optional step is
  // always surfaced until the user closes it / wires up presence detection.
  const showSetup = true;

  return (
    <main
      className="relative min-h-screen w-full"
      style={{
        background: "var(--bg)",
        color: "var(--ink)",
        paddingBottom: "calc(78px + env(safe-area-inset-bottom) + 16px)",
      }}
    >
      {/* Mobile header */}
      <header
        className="flex items-center justify-between px-5 pt-5 md:hidden"
        style={{ gap: 12 }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            aria-hidden
            className="grid place-items-center"
            style={{
              width: 36,
              height: 36,
              flex: "none",
              borderRadius: 999,
              background: "var(--accent-soft)",
              color: "var(--accent-deep)",
            }}
          >
            <Glyph.today size={18} />
          </div>
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
              Hello,
            </div>
            <div
              className="display truncate"
              style={{ fontSize: 22, marginTop: 2 }}
            >
              {firstName(user.fullName)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="pill"
            style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
          >
            <Glyph.sun size={14} /> 21° clear
          </span>
          <HeaderBell unreadCount={unread} locale={locale} />
        </div>
      </header>

      <div
        className="mx-auto w-full px-5 pt-6 md:pt-10"
        style={{ maxWidth: 1080 }}
      >
        <div className="grid items-start gap-8 lg:grid-cols-[0.82fr_1.18fr]">
          {/* Info column - desktop only */}
          <section className="hidden lg:block">
            <Link
              href={`/${locale}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm font-semibold"
              style={{
                borderColor: "var(--line)",
                background: "var(--surface)",
                color: "var(--ink)",
              }}
            >
              <Glyph.back size={16} />
              {t("back")}
            </Link>
            <div
              className="mt-8 grid place-items-center"
              style={{
                width: 56,
                height: 56,
                borderRadius: 999,
                background: "var(--accent-soft)",
                color: "var(--accent-deep)",
              }}
            >
              <Glyph.today size={26} />
            </div>
            <h2
              className="display mt-5"
              style={{
                fontSize: 44,
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
              }}
            >
              {t("title")}
            </h2>
            <p
              className="mt-4 max-w-md leading-relaxed"
              style={{ color: "var(--ink-muted)", fontSize: 15 }}
            >
              {t("body")}
            </p>
            {showSetup ? (
              <div className="mt-8">
                <SetupBanner
                  complete={requiredComplete}
                  total={totalSteps}
                  nextLabel="Add a photo"
                  nextHref={`/${locale}/onboarding/photo`}
                />
              </div>
            ) : null}
          </section>

          {/* Hero column */}
          <section className="flex flex-col gap-4">
            {showSetup ? (
              <div className="lg:hidden">
                <SetupBanner
                  complete={requiredComplete}
                  total={totalSteps}
                  nextLabel="Add a photo"
                  nextHref={`/${locale}/onboarding/photo`}
                />
              </div>
            ) : null}
            <TodayPromptCard
              copy={t.raw("card")}
              group={todayState.data.group}
              locale={locale}
              maxDistanceKm={user.maxDistanceKm}
              prompt={todayState.data.prompt}
              response={todayState.data.response}
              sports={user.sports}
            />
          </section>
        </div>
      </div>

      <MobileTabBar />
    </main>
  );
}
