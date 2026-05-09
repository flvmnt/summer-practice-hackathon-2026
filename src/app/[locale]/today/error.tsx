"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect } from "react";
import { Glyph } from "@/components/ui/Glyph";

export default function TodayError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("routeStates");
  const locale = useLocale();
  const section = t("sections.today");

  useEffect(() => {
    // Surface the digest so server logs can be correlated, never the message.
    if (error.digest) {
      console.error("[today] error digest:", error.digest);
    }
  }, [error.digest]);

  return (
    <main
      className="grid min-h-screen place-items-center px-5"
      style={{
        background: "var(--bg)",
        color: "var(--ink)",
        paddingBottom: "calc(78px + env(safe-area-inset-bottom) + 16px)",
      }}
    >
      <section className="w-full max-w-md text-center">
        <div
          aria-hidden
          className="mx-auto grid place-items-center"
          style={{
            width: 56,
            height: 56,
            borderRadius: 999,
            background: "var(--alert-soft)",
            color: "var(--alert)",
          }}
        >
          <Glyph.spark size={24} />
        </div>
        <h1 className="display mt-5" style={{ fontSize: 28, lineHeight: 1.05 }}>
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
