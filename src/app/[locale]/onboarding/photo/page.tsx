import { redirect } from "next/navigation";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

/**
 * Photo capture moved into the merged profile step. This route now redirects
 * to /today so any deep link or stored back-stack entry still lands somewhere
 * sensible. Drop the route entirely once redirects/links elsewhere stop
 * pointing here.
 */
export default async function PhotoOnboardingPage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale }>;
}>) {
  const { locale } = await params;
  redirect(`/${locale}/today`);
}
