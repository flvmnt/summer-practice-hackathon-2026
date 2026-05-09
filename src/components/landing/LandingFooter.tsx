import Link from "next/link";
import type { AppLocale } from "@/i18n/routing";

type Props = {
  locale: AppLocale;
  demoEnabled: boolean;
  githubUrl?: string;
};

function FooterWordmark() {
  return (
    <span
      className="display"
      style={{
        fontSize: 24,
        lineHeight: 1,
        letterSpacing: "-0.045em",
        display: "inline-flex",
        alignItems: "baseline",
      }}
    >
      s
      <span style={{ color: "var(--accent)" }}>2</span>m
    </span>
  );
}

export function LandingFooter({ locale, demoEnabled, githubUrl }: Props) {
  const otherLocale: AppLocale = locale === "ro" ? "en" : "ro";

  return (
    <footer
      className="w-full"
      style={{
        background: "var(--bg)",
        borderTop: "1px solid var(--line)",
        paddingTop: 40,
        paddingBottom: 40,
      }}
    >
      <div
        className="mx-auto w-full px-5 sm:px-8"
        style={{ maxWidth: "var(--page-max)" }}
      >
        <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-start">
          <div>
            <FooterWordmark />
            <p
              className="mt-3 max-w-md"
              style={{
                fontSize: 13,
                color: "var(--ink-muted)",
                lineHeight: 1.5,
              }}
            >
              ShowUp2Move. Spontaneous sports matching for Timișoara.
            </p>
          </div>
          <div className="flex flex-wrap items-center" style={{ gap: 18 }}>
            {demoEnabled ? (
              <Link
                href={`/${locale}/demo`}
                style={{
                  fontSize: 13,
                  color: "var(--ink)",
                  fontWeight: 600,
                }}
              >
                Demo
              </Link>
            ) : null}
            {githubUrl ? (
              <a
                href={githubUrl}
                target="_blank"
                rel="noreferrer noopener"
                style={{
                  fontSize: 13,
                  color: "var(--ink)",
                  fontWeight: 600,
                }}
              >
                GitHub
              </a>
            ) : null}
            <Link
              href={`/${locale}/leaderboard`}
              style={{
                fontSize: 13,
                color: "var(--ink)",
                fontWeight: 600,
              }}
            >
              Leaderboard
            </Link>
            <Link
              href={`/${locale}/calendar`}
              style={{
                fontSize: 13,
                color: "var(--ink)",
                fontWeight: 600,
              }}
            >
              Calendar
            </Link>
            <span
              aria-hidden="true"
              style={{
                fontSize: 13,
                color: "var(--ink-faint)",
              }}
            >
              Privacy (soon)
            </span>
            <Link
              href={`/${otherLocale}`}
              hrefLang={otherLocale}
              className="mono"
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "6px 10px",
                borderRadius: "var(--r-pill)",
                background: "var(--surface)",
                boxShadow: "inset 0 0 0 1px var(--line)",
                color: "var(--ink)",
              }}
            >
              {locale.toUpperCase()} → {otherLocale.toUpperCase()}
            </Link>
          </div>
        </div>
        <div
          className="mt-8 flex flex-wrap items-center justify-between"
          style={{
            paddingTop: 18,
            borderTop: "1px solid var(--line)",
            gap: 12,
          }}
        >
          <span
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--ink-faint)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            © 2026 ShowUp2Move · Haufe summer practice
          </span>
          <span
            className="mono"
            style={{ fontSize: 11, color: "var(--ink-faint)" }}
          >
            Built in Timișoara
          </span>
        </div>
      </div>
    </footer>
  );
}
