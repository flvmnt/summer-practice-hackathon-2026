import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { SportsForm } from "@/components/onboarding/SportsForm";
import type { AppLocale } from "@/i18n/routing";
import { getOnboardingUserState } from "@/lib/onboarding-state";

export const dynamic = "force-dynamic";

export default async function SportsOnboardingPage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("onboarding.sports");
  const user = await getOnboardingUserState();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <main
      className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 pt-6"
      style={{ background: "var(--bg)", color: "var(--ink)" }}
    >
      <SportsForm copy={t.raw("form")} defaultSports={user.sports} locale={locale} />
    </main>
  );
}
