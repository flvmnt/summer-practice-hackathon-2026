import { NextIntlClientProvider } from "next-intl";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { WalkthroughNav } from "@/components/demo/WalkthroughNav";
import { routing, type AppLocale } from "@/i18n/routing";
import { WALKTHROUGH_COOKIE } from "@/lib/demo/walkthrough";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale as AppLocale);

  const walkthroughActive =
    (await cookies()).get(WALKTHROUGH_COOKIE)?.value === "1";

  return (
    <NextIntlClientProvider>
      {children}
      {walkthroughActive ? <WalkthroughNav locale={locale as AppLocale} /> : null}
    </NextIntlClientProvider>
  );
}
