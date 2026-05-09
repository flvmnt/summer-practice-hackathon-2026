import { Trophy } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
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
    <main className="mx-auto grid min-h-screen w-full max-w-5xl items-center gap-8 px-5 py-8 lg:grid-cols-[0.82fr_1.18fr]">
      <section>
        <Link
          className="inline-flex min-h-11 items-center rounded-md border border-[var(--line)] bg-[var(--panel-strong)] px-3 text-sm font-semibold"
          href={`/${locale}/onboarding/profile`}
        >
          {t("back")}
        </Link>
        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
          {t("eyebrow")}
        </p>
        <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-4 max-w-xl leading-7 text-[var(--muted)]">{t("body")}</p>
      </section>

      <section className="rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-5 shadow-sm sm:p-7">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-[var(--mint)] text-[var(--navy)]">
            <Trophy aria-hidden="true" size={20} />
          </span>
          <div>
            <h2 className="text-xl font-bold">{t("cardTitle")}</h2>
            <p className="text-sm text-[var(--muted)]">{t("cardBody")}</p>
          </div>
        </div>
        <SportsForm copy={t.raw("form")} defaultSports={user.sports} locale={locale} />
      </section>
    </main>
  );
}
