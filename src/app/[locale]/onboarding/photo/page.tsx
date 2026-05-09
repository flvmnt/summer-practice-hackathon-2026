import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { PhotoForm } from "@/components/onboarding/PhotoForm";
import type { AppLocale } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth-current-user";

export const dynamic = "force-dynamic";

export default async function PhotoOnboardingPage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // `getCurrentUser` does not surface `photoUrl` and that helper is owned by
  // another agent. Hand `null` for now; the local preview state in PhotoForm
  // covers the demo flow until a later wave wires the canonical query.
  return (
    <main style={{ background: "var(--bg)", minHeight: "100dvh" }}>
      <PhotoForm locale={locale} initialPhotoUrl={null} />
    </main>
  );
}
