import { ArrowLeft } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { SignupForm } from "@/components/auth/SignupForm";
import type { AppLocale } from "@/i18n/routing";

export default async function SignupPage({
  params,
}: Readonly<{
  params: Promise<{ locale: AppLocale }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth.signup");

  // Wave-1 partial copy (RevealCopy + show/hide labels). Wave 3 will fold into
  // canonical messages/{locale}/common.json.
  const revealCopy = {
    eyebrow: locale === "ro" ? "Salvează codul" : "Save your code",
    title: locale === "ro" ? "Salvează acest cod de recuperare." : "Save this recovery code.",
    body:
      locale === "ro"
        ? "Este singura cale înapoi în cont dacă uiți parola. Nu îl putem recupera pentru tine."
        : "It's the only way back into your account if you forget your password. We can't recover this for you.",
    label: locale === "ro" ? "Codul tău de recuperare" : "Your recovery code",
    copy: locale === "ro" ? "Copiază codul" : "Copy code",
    copied: locale === "ro" ? "Copiat" : "Copied",
    download: locale === "ro" ? "Descarcă .txt" : "Download as .txt",
    downloaded: locale === "ro" ? "Descărcat" : "Downloaded",
    savedConfirm:
      locale === "ro" ? "L-am salvat undeva în siguranță" : "I have saved it somewhere safe",
    continue: locale === "ro" ? "Continuă spre profil" : "Continue to profile",
    privacy:
      locale === "ro"
        ? "Nu îl putem recupera pentru tine. Salvează-l acum."
        : "We can't recover this for you. Save it now.",
    toastCopiedTitle: locale === "ro" ? "Copiat" : "Copied",
    toastCopiedBody:
      locale === "ro"
        ? "Codul de recuperare e în clipboard."
        : "Your recovery code is on the clipboard.",
    toastDownloadedTitle: locale === "ro" ? "Salvat" : "Saved",
    toastDownloadedBody:
      locale === "ro" ? "Codul de recuperare salvat ca .txt" : "Recovery code saved as .txt",
  };

  const showLabel = locale === "ro" ? "Arată parola" : "Show password";
  const hideLabel = locale === "ro" ? "Ascunde parola" : "Hide password";
  const brandLine = locale === "ro" ? "Arată-te. Joacă." : "Show up. Move.";
  const brandTagline =
    locale === "ro" ? "Se formează un meci lângă tine." : "A pickup game is forming nearby.";

  return (
    <main
      className="mx-auto flex min-h-screen w-full flex-col items-stretch px-4 py-8 sm:max-w-md sm:px-6 sm:py-12"
      style={{ background: "var(--bg)" }}
    >
      <Link
        className="mono inline-flex w-fit items-center gap-2 text-[11px] font-bold uppercase"
        href={`/${locale}`}
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
        <h1 className="display" style={{ fontSize: 36, lineHeight: 1.02 }}>
          {brandLine}
        </h1>
        <p className="text-[14px]" style={{ color: "var(--ink-muted)", lineHeight: 1.5 }}>
          {brandTagline}
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
        <SignupForm
          copy={t.raw("form")}
          locale={locale}
          revealCopy={revealCopy}
          showLabel={showLabel}
          hideLabel={hideLabel}
        />
        <p
          className="mt-5 text-center text-[13px]"
          style={{ color: "var(--ink-muted)" }}
        >
          {t("hasAccount")}{" "}
          <Link
            className="font-semibold underline"
            href={`/${locale}/login`}
            style={{ color: "var(--ink)" }}
          >
            {t("login")}
          </Link>
        </p>
      </section>
    </main>
  );
}
