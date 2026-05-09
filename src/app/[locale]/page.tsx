import { setRequestLocale } from "next-intl/server";
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
  title: string;
  body: string;
  mark: "ai" | "pin" | "shield";
};

const WHY_ROWS: ReadonlyArray<WhyRow> = [
  {
    mark: "ai",
    title: "AI matchmaking",
    body: "Find groups by sport, skill, and proximity in seconds.",
  },
  {
    mark: "pin",
    title: "Real venues",
    body: "Suggested venues with weather, price tier, and directions.",
  },
  {
    mark: "shield",
    title: "Just show up",
    body: "Captain auto-creates the event. You confirm. Game on.",
  },
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

  return (
    <main
      className="min-h-screen w-full"
      style={{ background: "var(--bg)", color: "var(--ink)" }}
    >
      <Hero locale={locale} demoEnabled={demoEnabled} />
      <LiveCardsRow />
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
              Why ShowUp2Move
            </span>
            <h2
              className="display mt-2"
              style={{
                fontSize: "clamp(28px, 4vw, 40px)",
                letterSpacing: "-0.025em",
                lineHeight: 1.05,
              }}
            >
              Built for Saturday-morning energy.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {WHY_ROWS.map((row) => (
              <div
                key={row.title}
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
                  {row.title}
                </h3>
                <p
                  className="mt-2"
                  style={{
                    fontSize: 14,
                    color: "var(--ink-muted)",
                    lineHeight: 1.5,
                  }}
                >
                  {row.body}
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
