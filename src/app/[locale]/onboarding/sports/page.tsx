import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { SportsForm } from "@/components/onboarding/SportsForm";
import type { AppLocale } from "@/i18n/routing";
import { getOnboardingUserState } from "@/lib/onboarding-state";
import { SPORT_KEYS, type SportKey } from "@/lib/sports";

export const dynamic = "force-dynamic";

function parseSuggested(value: string | string[] | undefined): SportKey[] {
  if (!value) return [];
  const raw = Array.isArray(value) ? value.join(",") : value;
  const seen = new Set<SportKey>();
  for (const entry of raw.split(",")) {
    const trimmed = entry.trim();
    if (SPORT_KEYS.includes(trimmed as SportKey)) {
      seen.add(trimmed as SportKey);
    }
  }
  return Array.from(seen).slice(0, 3);
}

export default async function SportsOnboardingPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: AppLocale }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("onboarding.sports");
  const user = await getOnboardingUserState();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const params2 = (await searchParams) ?? {};
  const suggestedSports = parseSuggested(params2.suggested);

  const aiCopy = {
    label: t("aiSuggestionsLabel"),
    hint: t("aiSuggestionsHint"),
  };

  return (
    <main
      className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 pt-6"
      style={{ background: "var(--bg)", color: "var(--ink)" }}
    >
      <SportsForm
        copy={t.raw("form")}
        defaultSports={user.sports}
        locale={locale}
        suggestedSports={suggestedSports}
        aiSuggestionsCopy={aiCopy}
      />
    </main>
  );
}
