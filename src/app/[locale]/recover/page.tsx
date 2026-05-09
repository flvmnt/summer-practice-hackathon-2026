import { ArrowLeft } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { RecoverForm } from "@/components/auth/RecoverForm";
import type { AppLocale } from "@/i18n/routing";

export default async function RecoverPage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth.recover");

  const showLabel = locale === "ro" ? "Arată parola" : "Show password";
  const hideLabel = locale === "ro" ? "Ascunde parola" : "Hide password";
  const steps = {
    step1: locale === "ro" ? "1. Identificare" : "1. Identify",
    step2: locale === "ro" ? "2. Parolă nouă" : "2. New password",
    step3: locale === "ro" ? "3. Gata" : "3. Done",
  };

  return (
    <main
      className="mx-auto flex min-h-screen w-full flex-col items-stretch px-4 py-8 sm:max-w-md sm:px-6 sm:py-12"
      style={{ background: "var(--bg)" }}
    >
      <Link
        className="mono inline-flex w-fit items-center gap-2 text-[11px] font-bold uppercase"
        href={`/${locale}/login`}
        style={{
          letterSpacing: "0.14em",
          color: "var(--ink-muted)",
          padding: "8px 10px",
          borderRadius: "var(--r-pill)",
        }}
      >
        <ArrowLeft aria-hidden="true" size={14} />
        {t("back")}
      </Link>

      <header className="mt-6 grid gap-1.5">
        <p
          className="mono text-[10px] font-bold uppercase"
          style={{ color: "var(--accent-deep)", letterSpacing: "0.18em" }}
        >
          {t("eyebrow")}
        </p>
        <h1 className="display" style={{ fontSize: 32, lineHeight: 1.05 }}>
          {t("title")}
        </h1>
        <p className="text-[14px]" style={{ color: "var(--ink-muted)", lineHeight: 1.5 }}>
          {t("body")}
        </p>
      </header>

      <section
        className="mt-6 p-5 sm:p-6"
        style={{
          background: "var(--surface)",
          borderRadius: "var(--r-surface)",
          boxShadow: "var(--shadow-2)",
          border: "1px solid var(--line)",
        }}
      >
        <div className="mb-4 grid gap-1">
          <h2 className="display" style={{ fontSize: 22, lineHeight: 1.1 }}>
            {t("cardTitle")}
          </h2>
          <p className="text-[13px]" style={{ color: "var(--ink-muted)", lineHeight: 1.5 }}>
            {t("cardBody")}
          </p>
        </div>
        <RecoverForm
          copy={t.raw("form")}
          locale={locale}
          steps={steps}
          showLabel={showLabel}
          hideLabel={hideLabel}
        />
      </section>
    </main>
  );
}
