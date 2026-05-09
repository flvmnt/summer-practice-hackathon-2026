"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect } from "react";

export default function NotificationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("routeStates");
  const locale = useLocale();
  const section = t("sections.notifications");

  useEffect(() => {
    if (error.digest) {
      console.error("[notifications] error digest:", error.digest);
    }
  }, [error.digest]);

  return (
    <main
      className="grid min-h-screen place-items-center px-5"
      style={{
        background: "var(--bg)",
        color: "var(--ink)",
        paddingBottom: "calc(96px + env(safe-area-inset-bottom) + 16px)",
      }}
    >
      <section className="w-full max-w-md text-center">
        <h1 className="display" style={{ fontSize: 28, lineHeight: 1.05 }}>
          {t("errorTitle")}
        </h1>
        <p
          className="mt-2 text-sm"
          style={{ color: "var(--ink-muted)", lineHeight: 1.5 }}
        >
          {t("errorBody", { section })}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => reset()} className="btn-s2m">
            {t("retry")}
          </button>
          <Link
            href={`/${locale}/today`}
            className="btn-s2m btn-secondary"
          >
            {t("backToToday")}
          </Link>
        </div>
      </section>
    </main>
  );
}
