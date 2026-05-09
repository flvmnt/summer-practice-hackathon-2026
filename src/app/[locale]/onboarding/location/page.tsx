import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { LocationForm } from "@/components/onboarding/LocationForm";
import type { AppLocale } from "@/i18n/routing";
import { getOnboardingUserState } from "@/lib/onboarding-state";

export const dynamic = "force-dynamic";

export default async function LocationOnboardingPage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("onboarding.location");
  const user = await getOnboardingUserState();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <main
      className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 pt-6"
      style={{ background: "var(--bg)", color: "var(--ink)" }}
    >
      <LocationForm
        copy={t.raw("form")}
        defaultCity={user.city ?? "Timisoara"}
        defaultHomeLat={user.homeLat ?? "45.748900"}
        defaultHomeLng={user.homeLng ?? "21.208700"}
        defaultMaxDistanceKm={user.maxDistanceKm}
        locale={locale}
      />
    </main>
  );
}
