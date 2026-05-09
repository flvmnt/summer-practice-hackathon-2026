import { ShieldAlert } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { AppLocale } from "@/i18n/routing";
import { isDemoModeEnabled } from "@/lib/demo/guard";

export const dynamic = "force-dynamic";

export default async function DemoPlaceholderPage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const enabled = isDemoModeEnabled();
  if (!enabled) {
    notFound();
  }

  const t = await getTranslations("demo");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-5 py-10">
      <div className="rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-6 shadow-sm">
        <ShieldAlert
          aria-hidden="true"
          className="text-[var(--accent-strong)]"
          size={30}
        />
        <h1 className="mt-5 text-3xl font-bold">{t("title")}</h1>
        <p className="mt-3 leading-7 text-[var(--muted)]">
          {t("enabledBody")}
        </p>
      </div>
    </main>
  );
}
