import { Activity, ArrowRight, MapPin, ShieldCheck, UsersRound } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import type { AppLocale } from "@/i18n/routing";

const proofIcons = [Activity, UsersRound, MapPin, ShieldCheck] as const;

export default async function HomePage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const proofT = await getTranslations("home.proofCards");
  const loopSteps = t.raw("loopSteps") as string[];

  return (
    <main className="min-h-screen">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-[var(--accent)] text-white">
              <Activity aria-hidden="true" size={22} strokeWidth={2.4} />
            </div>
            <span className="text-lg font-semibold">ShowUp2Move</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              className="inline-flex min-h-11 items-center rounded-md border border-[var(--line)] bg-[var(--panel-strong)] px-3 text-sm font-semibold"
              href={locale === "ro" ? "/en" : "/ro"}
              hrefLang={locale === "ro" ? "en" : "ro"}
            >
              {t("languageSwitch")}
            </Link>
            <Link
              className="inline-flex min-h-11 items-center rounded-md border border-[var(--line)] bg-[var(--panel-strong)] px-3 text-sm font-semibold"
              href={`/${locale}/login`}
            >
              {t("login")}
            </Link>
            <Link
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--panel-strong)] px-4 text-sm font-semibold"
              href="/api/health"
            >
              {t("health")}
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
        </header>

        <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.02fr_0.98fr] lg:py-16">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
              {t("eyebrow")}
            </p>
            <h1 className="text-5xl font-bold leading-[1.02] sm:text-6xl lg:text-7xl">
              {t("title")}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--muted)]">
              {t("subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="inline-flex min-h-12 items-center gap-2 rounded-md bg-[var(--accent)] px-5 font-semibold text-white shadow-sm"
                href={`/${locale}/signup`}
              >
                {t("signup")}
                <ArrowRight aria-hidden="true" size={18} />
              </Link>
              <Link
                className="inline-flex min-h-12 items-center rounded-md border border-[var(--line)] bg-[var(--panel-strong)] px-5 font-semibold"
                href={`/${locale}/today`}
              >
                {t("openToday")}
              </Link>
              <Link
                className="inline-flex min-h-12 items-center rounded-md border border-[var(--line)] bg-[var(--panel-strong)] px-5 font-semibold"
                href={`/${locale}/demo`}
              >
                {t("judgeMode")}
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4 shadow-sm sm:p-6">
            <ol className="grid gap-3">
              {loopSteps.map((step, index) => (
                <li
                  className="grid grid-cols-[2.5rem_1fr] items-center gap-3 rounded-md bg-[var(--panel-strong)] p-3"
                  key={step}
                >
                  <span className="flex size-10 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-bold text-[var(--accent-strong)]">
                    {index + 1}
                  </span>
                  <span className="font-semibold">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <section className="grid gap-3 pb-6 sm:grid-cols-2 lg:grid-cols-4">
          {proofIcons.map((Icon, index) => (
            <article
              className="rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-4"
              key={proofT(`${index}.title`)}
            >
              <Icon
                aria-hidden="true"
                className="mb-4 text-[var(--accent-strong)]"
                size={24}
              />
              <h2 className="text-base font-semibold">{proofT(`${index}.title`)}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {proofT(`${index}.text`)}
              </p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
