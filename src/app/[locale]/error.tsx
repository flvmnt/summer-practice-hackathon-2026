"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function LocaleError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname() ?? "/en";
  const locale = pathname.startsWith("/ro") ? "ro" : "en";

  return (
    <main
      className="grid min-h-screen place-items-center px-5"
      style={{ background: "var(--bg)", color: "var(--ink)" }}
    >
      <section className="w-full max-w-md text-center">
        <h1 className="display" style={{ fontSize: 32, lineHeight: 1.05 }}>
          Something slipped.
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--ink-muted)" }}>
          Try again or return to Today.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" onClick={reset} className="btn-s2m">
            Retry
          </button>
          <Link href={`/${locale}/today`} className="btn-s2m btn-secondary">
            Today
          </Link>
        </div>
      </section>
    </main>
  );
}
