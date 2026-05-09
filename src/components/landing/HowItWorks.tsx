import { Glyph, type GlyphName } from "@/components/ui/Glyph";

type Step = {
  num: string;
  glyph: GlyphName;
  title: string;
  body: string;
};

const STEPS: ReadonlyArray<Step> = [
  {
    num: "01",
    glyph: "profile",
    title: "Sign up",
    body: "Username + password. A recovery code, never an email blast.",
  },
  {
    num: "02",
    glyph: "pin",
    title: "Set sports + location",
    body: "Pick what you play. Drop a fuzzy home pin. We never store the exact one.",
  },
  {
    num: "03",
    glyph: "today",
    title: "ShowUpToday?",
    body: "One tap each morning. Yes - we look for nearby players right now.",
  },
  {
    num: "04",
    glyph: "groups",
    title: "Match + meet",
    body: "Captain auto-creates the event. Vote on the venue. Show up. Game on.",
  },
];

export function HowItWorks() {
  return (
    <section
      className="w-full"
      style={{
        background: "var(--bg-alt)",
        paddingTop: 56,
        paddingBottom: 56,
      }}
    >
      <div
        className="mx-auto w-full px-5 sm:px-8"
        style={{ maxWidth: "var(--page-max)" }}
      >
        <div className="mb-8">
          <span
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--ink-muted)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            How it works
          </span>
          <h2
            className="display mt-2"
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              letterSpacing: "-0.025em",
              lineHeight: 1.05,
            }}
          >
            Four taps from idea to kickoff.
          </h2>
        </div>
        <ol
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          style={{ listStyle: "none", padding: 0, margin: 0 }}
        >
          {STEPS.map((step) => {
            const Icon = Glyph[step.glyph];
            return (
              <li
                key={step.num}
                style={{
                  background: "var(--surface)",
                  borderRadius: "var(--r-card)",
                  border: "1px solid var(--line)",
                  padding: 22,
                  boxShadow: "var(--shadow-1)",
                }}
              >
                <div
                  className="flex items-start justify-between"
                  style={{ marginBottom: 16 }}
                >
                  <span
                    className="mono"
                    style={{
                      fontSize: 28,
                      letterSpacing: "-0.02em",
                      color: "var(--accent)",
                      fontWeight: 700,
                    }}
                  >
                    {step.num}
                  </span>
                  <span
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "var(--r-chip)",
                      background: "var(--accent-tint)",
                      color: "var(--accent-deep)",
                      display: "grid",
                      placeItems: "center",
                    }}
                    aria-hidden="true"
                  >
                    <Icon size={20} />
                  </span>
                </div>
                <h3
                  className="display"
                  style={{
                    fontSize: 20,
                    letterSpacing: "-0.015em",
                    lineHeight: 1.1,
                  }}
                >
                  {step.title}
                </h3>
                <p
                  className="mt-2"
                  style={{
                    fontSize: 14,
                    color: "var(--ink-muted)",
                    lineHeight: 1.5,
                  }}
                >
                  {step.body}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
