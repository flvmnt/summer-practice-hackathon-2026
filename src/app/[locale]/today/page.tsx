import { CalendarClock } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TodayPromptCard } from "@/components/today/TodayPromptCard";
import type { AppLocale } from "@/i18n/routing";
import { getOnboardingUserState } from "@/lib/onboarding-state";
import { getMyTodayStateAction } from "@/lib/prompt";

export const dynamic = "force-dynamic";

export default async function TodayPlaceholderPage({
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

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-5xl items-center gap-8 px-5 py-8 lg:grid-cols-[0.82fr_1.18fr]">
      <section>
        <Link
          className="inline-flex min-h-11 items-center rounded-md border border-[var(--line)] bg-[var(--panel-strong)] px-3 text-sm font-semibold"
          href={`/${locale}`}
        >
          {t("back")}
        </Link>
        <div className="mt-8 flex size-12 items-center justify-center rounded-full bg-[var(--mint)] text-[var(--navy)]">
          <CalendarClock aria-hidden="true" size={24} />
        </div>
        <h2 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">
          {t("title")}
        </h2>
        <p className="mt-4 max-w-xl leading-7 text-[var(--muted)]">{t("body")}</p>
      </section>
      <TodayPromptCard
        copy={t.raw("card")}
        group={todayState.data.group}
        locale={locale}
        maxDistanceKm={user.maxDistanceKm}
        prompt={todayState.data.prompt}
        response={todayState.data.response}
        sports={user.sports}
      />
    </main>
  );
}
