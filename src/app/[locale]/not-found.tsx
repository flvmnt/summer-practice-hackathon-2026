import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function LocaleNotFound() {
  const t = await getTranslations("notFound");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-5 py-10">
      <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-3 leading-7 text-[var(--muted)]">
          {t("body")}
        </p>
        <Link
          className="mt-6 inline-flex min-h-11 items-center rounded-md bg-[var(--lime)] px-4 font-semibold text-[var(--navy)]"
          href="/ro"
        >
          {t("back")}
        </Link>
      </div>
    </main>
  );
}
