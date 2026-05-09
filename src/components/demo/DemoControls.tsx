"use client";

import Link from "next/link";
import type { AppLocale } from "@/i18n/routing";

type Copy = {
  scriptedFlow: string;
};

type Props = {
  locale: AppLocale;
  copy: Copy;
};

export function DemoControls({ locale, copy }: Props) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <Link
        href={`/${locale}/demo/scripted`}
        className="btn-s2m"
        style={{
          minHeight: 44,
          padding: "10px 16px",
          fontSize: 14,
          gap: 8,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          textDecoration: "none",
        }}
      >
        {copy.scriptedFlow}
      </Link>
    </div>
  );
}
