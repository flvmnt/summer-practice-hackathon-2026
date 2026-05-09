import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LiveCardsRow } from "@/components/landing/LiveCardsRow";
import { AIMark } from "@/components/ui/AIMark";
import { Glyph } from "@/components/ui/Glyph";
import type { AppLocale } from "@/i18n/routing";
import { isDemoModeEnabled } from "@/lib/demo/guard";
import { getOnboardingUserState } from "@/lib/onboarding-state";

export const dynamic = "force-dynamic";

type WhyRow = {
  key: "ai" | "venues" | "show";
  titleKey: "ai.title" | "venues.title" | "show.title";
  bodyKey: "ai.body" | "venues.body" | "show.body";
  mark: "ai" | "pin" | "shield";
};

const WHY_ROWS: ReadonlyArray<WhyRow> = [
  { key: "ai", titleKey: "ai.title", bodyKey: "ai.body", mark: "ai" },
  { key: "venues", titleKey: "venues.title", bodyKey: "venues.body", mark: "pin" },
  { key: "show", titleKey: "show.title", bodyKey: "show.body", mark: "shield" },
];

export default async function HomePage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Authed users skip the landing entirely.
  const user = await getOnboardingUserState();
  if (user) {
    redirect(`/${locale}/today`);
  }

  const demoEnabled = isDemoModeEnabled();
  const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL;
  const t = await getTranslations("landing.why");

  return (
    <main
      className="min-h-screen w-full"
      style={{ background: "var(--bg)", color: "var(--ink)" }}
    >
      <Hero locale={locale} demoEnabled={demoEnabled} />
      <LiveCardsRow locale={locale} />
      <HowItWorks />

      {/* Why ShowUp2Move */}
      <section
        className="w-full"
        style={{ background: "var(--bg)", paddingTop: 56, paddingBottom: 56 }}
      >
        <div
          className="mx-auto w-full px-5 sm:px-8"
          style={{ maxWidth: "var(--page-max)" }}
        >
          <div className="mb-8">
            <span
              className="mono"
              style={{
                fontSize: 11,
                color: "var(--ink-muted)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              {t("kicker")}
            </span>
            <h2
              className="display mt-2"
              style={{
                fontSize: "clamp(28px, 4vw, 40px)",
                letterSpacing: "-0.025em",
                lineHeight: 1.05,
              }}
            >
              {t("title")}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {WHY_ROWS.map((row) => (
              <div
                key={row.key}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--r-card)",
                  padding: 24,
                  boxShadow: "var(--shadow-1)",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 999,
                    background: "var(--accent-soft)",
                    color: "var(--accent-deep)",
                    display: "grid",
                    placeItems: "center",
                    marginBottom: 16,
                  }}
                  aria-hidden="true"
                >
                  {row.mark === "ai" ? (
                    <AIMark size={20} />
                  ) : row.mark === "pin" ? (
                    <Glyph.pin size={20} />
                  ) : (
                    <Glyph.shield size={20} />
                  )}
                </div>
                <h3
                  className="display"
                  style={{
                    fontSize: 22,
                    letterSpacing: "-0.015em",
                    lineHeight: 1.1,
                  }}
                >
                  {t(row.titleKey)}
                </h3>
                <p
                  className="mt-2"
                  style={{
                    fontSize: 14,
                    color: "var(--ink-muted)",
                    lineHeight: 1.5,
                  }}
                >
                  {t(row.bodyKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter
        locale={locale}
        demoEnabled={demoEnabled}
        githubUrl={githubUrl}
      />
    </main>
  );
}
