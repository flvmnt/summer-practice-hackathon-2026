import Link from "next/link";
import { Glyph } from "@/components/ui/Glyph";
import type { AppLocale } from "@/i18n/routing";

type Props = {
  locale: AppLocale;
  demoEnabled: boolean;
};

function Wordmark({ size = 28 }: { size?: number }) {
  return (
    <span
      className="display"
      style={{
        fontSize: size,
        lineHeight: 1,
        letterSpacing: "-0.05em",
        color: "var(--ink)",
        display: "inline-flex",
        alignItems: "baseline",
      }}
      aria-label="ShowUp2Move"
    >
      s
      <span
        style={{ color: "var(--accent)", fontWeight: 400 }}
        aria-hidden="true"
      >
        2
      </span>
      m
    </span>
  );
}

export function Hero({ locale, demoEnabled }: Props) {
  const demoHref = demoEnabled ? `/${locale}/demo` : `/${locale}/today`;

  return (
    <section
      className="pitch-bg relative w-full"
      style={{
        background: "var(--bg)",
        color: "var(--ink)",
      }}
    >
      <div
        className="mx-auto w-full px-5 sm:px-8"
        style={{ maxWidth: "var(--page-max)" }}
      >
        {/* Top nav */}
        <nav
          className="flex items-center justify-between"
          aria-label="Primary"
          style={{ paddingTop: 24, paddingBottom: 12 }}
        >
          <Link href={`/${locale}`} className="inline-flex items-center">
            <Wordmark size={32} />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href={`/${locale}/login`}
              className="btn-s2m btn-ghost"
              style={{
                minHeight: 40,
                padding: "8px 14px",
                fontSize: 14,
              }}
            >
              Log in
            </Link>
            <Link
              href={`/${locale}/signup`}
              className="btn-s2m"
              style={{
                minHeight: 44,
                padding: "10px 18px",
                fontSize: 14,
              }}
            >
              Sign up
            </Link>
          </div>
        </nav>

        {/* Headline */}
        <div
          className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]"
          style={{ paddingTop: 40, paddingBottom: 56 }}
        >
          <div>
            <span
              className="mono"
              style={{
                display: "inline-block",
                fontSize: 11,
                color: "var(--ink-muted)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                marginBottom: 18,
              }}
            >
              Sports matching · Timișoara
            </span>
            <h1
              className="display"
              style={{
                fontSize: "clamp(48px, 8.5vw, 96px)",
                lineHeight: 0.96,
                letterSpacing: "-0.045em",
                margin: 0,
              }}
            >
              Show up.
              <br />
              <span style={{ color: "var(--accent)" }}>Move.</span> Today.
            </h1>
            <p
              className="mt-6 max-w-xl"
              style={{
                fontSize: 18,
                lineHeight: 1.5,
                color: "var(--ink-muted)",
              }}
            >
              ShowUp2Move matches you with nearby players for football,
              basketball, tennis and more. AI does the matching. You just show
              up.
            </p>
            <div
              className="mt-8 flex flex-wrap items-center"
              style={{ gap: 12 }}
            >
              <Link
                href={`/${locale}/signup`}
                className="btn-s2m"
                style={{
                  minHeight: 56,
                  padding: "16px 26px",
                  fontSize: 17,
                }}
              >
                Start playing
              </Link>
              <Link
                href={demoHref}
                className="btn-s2m btn-secondary"
                style={{
                  minHeight: 56,
                  padding: "16px 22px",
                  fontSize: 17,
                }}
              >
                View demo
              </Link>
            </div>
            <div
              className="mt-6 flex flex-wrap items-center"
              style={{ gap: 18, color: "var(--ink-faint)", fontSize: 13 }}
            >
              <span className="inline-flex items-center" style={{ gap: 6 }}>
                <Glyph.shield size={14} /> Private location
              </span>
              <span className="inline-flex items-center" style={{ gap: 6 }}>
                <Glyph.pulse size={14} /> Real venues
              </span>
              <span className="inline-flex items-center" style={{ gap: 6 }}>
                <span className="ai-mark" style={{ color: "var(--accent)" }} />
                AI matchmaking
              </span>
            </div>
          </div>

          {/* Hero side card - captain-crown moment */}
          <div className="hidden lg:block">
            <div
              style={{
                background: "var(--surface)",
                borderRadius: "var(--r-surface)",
                border: "1px solid var(--line)",
                boxShadow: "var(--shadow-3)",
                padding: 24,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: "auto -40px -40px auto",
                  width: 220,
                  height: 220,
                  background:
                    "radial-gradient(closest-side, var(--accent-soft), transparent 70%)",
                }}
              />
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  color: "var(--ink-muted)",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                Today · 18:00
              </div>
              <div
                className="display mt-3"
                style={{
                  fontSize: 32,
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                }}
              >
                Football match
                <br />
                <span style={{ color: "var(--accent)" }}>12/14</span> nearby
              </div>
              <div className="mt-4 flex items-center" style={{ gap: 8 }}>
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 999,
                      background: "var(--accent-soft)",
                      color: "var(--accent-deep)",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 700,
                      fontSize: 13,
                      border: "2px solid var(--surface)",
                      marginLeft: i === 0 ? 0 : -10,
                    }}
                  >
                    {["AM", "VL", "DI", "MR"][i]}
                  </span>
                ))}
                <span
                  className="mono"
                  style={{
                    marginLeft: 6,
                    fontSize: 12,
                    color: "var(--ink-muted)",
                  }}
                >
                  +8
                </span>
              </div>
              <div
                className="mt-5 inline-flex items-center"
                style={{
                  gap: 8,
                  background: "var(--accent)",
                  color: "var(--on-accent)",
                  padding: "8px 14px",
                  borderRadius: "var(--r-pill)",
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                <Glyph.crown size={16} />
                Captain · Andrei
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
