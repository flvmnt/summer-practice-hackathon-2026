import { UserRoundCog } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";

export default async function ProfileOnboardingPage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("onboarding.profile");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-5 py-10">
      <div className="rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-6 shadow-sm">
        <UserRoundCog
          aria-hidden="true"
          className="text-[var(--accent-strong)]"
          size={28}
        />
        <h1 className="mt-5 text-3xl font-bold">{t("title")}</h1>
        <p className="mt-3 leading-7 text-[var(--muted)]">{t("body")}</p>
      </div>
    </main>
  );
}
