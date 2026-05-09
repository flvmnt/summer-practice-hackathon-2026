import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { AppLocale } from "@/i18n/routing";
import { getEventInvitePreview } from "@/lib/invites";
import type { SportKey } from "@/lib/sports";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function InvitePreviewPage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale; token: string }>;
}>) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("invitePreview");
  const preview = await getEventInvitePreview(token);

  if (!preview) {
    notFound();
  }

  const sportLabel = t(`sports.${preview.event.sport as SportKey}`);
  const when = new Intl.DateTimeFormat(locale === "ro" ? "ro-RO" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Bucharest",
  }).format(new Date(preview.event.whenAt));

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-6">
      <Link
        className="inline-flex min-h-11 w-fit items-center rounded-md border border-[var(--line)] bg-white px-3 text-sm font-semibold"
        href={`/${locale}`}
      >
        {t("back")}
      </Link>
      <section className="mt-8 rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-5 shadow-sm">
        <p className="text-sm font-semibold text-[var(--muted)]">{t("eyebrow")}</p>
        <h1 className="mt-2 text-3xl font-bold">
          {t("title", { sport: sportLabel })}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{t("body")}</p>
        <div className="mt-5 grid gap-2 text-sm leading-6 text-[var(--muted)]">
          <p>{t("when", { when })}</p>
          <p>{t("duration", { minutes: preview.event.durationMin })}</p>
          <p>
            {t("location", {
              location: preview.event.customLocationText ?? t("venuePending"),
            })}
          </p>
          {preview.group?.city ? <p>{t("city", { city: preview.group.city })}</p> : null}
          <p className="rounded-md bg-[var(--cloud)] px-3 py-2 font-semibold">
            {t("status", {
              status: t(`statuses.${preview.event.status}`),
            })}
          </p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--court)] px-4 text-sm font-semibold text-white"
            href={`/${locale}/signup`}
          >
            {t("signup")}
          </Link>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--line)] bg-white px-4 text-sm font-semibold"
            href={`/${locale}/login`}
          >
            {t("login")}
          </Link>
        </div>
      </section>
    </main>
  );
}
