import { Card } from "@/components/ui/Card";
import { Glyph } from "@/components/ui/Glyph";
import { Pill } from "@/components/ui/Pill";

/**
 * Live demo cards — three CSS mockups showing the product mechanics.
 * NOT real screenshots; just compact layouts to anchor "this is real".
 */

function FootballCard() {
  return (
    <Card variant="card" style={{ padding: 20, boxShadow: "var(--shadow-2)" }}>
      <div className="flex items-center justify-between">
        <Pill variant="live">Live · today</Pill>
        <span
          className="mono"
          style={{ fontSize: 11, color: "var(--ink-muted)" }}
        >
          18:00
        </span>
      </div>
      <div
        className="display mt-3"
        style={{ fontSize: 22, lineHeight: 1.1, letterSpacing: "-0.02em" }}
      >
        Football today
      </div>
      <div
        className="mono mt-1"
        style={{ fontSize: 13, color: "var(--ink-muted)" }}
      >
        <span style={{ color: "var(--accent)", fontWeight: 700 }}>12/14</span>{" "}
        nearby · 1.4 km
      </div>
      <div className="mt-4 flex items-center" style={{ gap: 6 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              background: "var(--accent-soft)",
              color: "var(--accent-deep)",
              display: "grid",
              placeItems: "center",
              fontWeight: 700,
              fontSize: 11,
              border: "2px solid var(--surface)",
              marginLeft: i === 0 ? 0 : -8,
            }}
          >
            {["AM", "VL", "DI", "MR", "EL"][i]}
          </span>
        ))}
        <span
          aria-hidden="true"
          style={{
            marginLeft: 6,
            color: "var(--accent)",
          }}
        >
          <Glyph.crown size={16} />
        </span>
      </div>
      <div
        className="mt-4 inline-flex items-center"
        style={{
          gap: 6,
          background: "var(--field-soft)",
          color: "var(--field)",
          padding: "5px 10px",
          borderRadius: "var(--r-pill)",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        <Glyph.pin size={13} />
        Parcul Rozelor · turf
      </div>
    </Card>
  );
}

function TennisCard() {
  return (
    <Card variant="card" style={{ padding: 20, boxShadow: "var(--shadow-2)" }}>
      <div className="flex items-center justify-between">
        <Pill variant="accent">Tennis</Pill>
        <span
          className="mono"
          style={{ fontSize: 11, color: "var(--ink-muted)" }}
        >
          3/4 · 18:00
        </span>
      </div>
      <div
        className="display mt-3"
        style={{ fontSize: 22, lineHeight: 1.1, letterSpacing: "-0.02em" }}
      >
        Pick a venue
      </div>
      <div
        className="mono mt-1"
        style={{ fontSize: 12, color: "var(--ink-muted)" }}
      >
        Group voting · 4 votes in
      </div>
      <div className="mt-4 flex flex-col" style={{ gap: 10 }}>
        {[
          { name: "Tenis Club", pct: 60 },
          { name: "Sports Park", pct: 30 },
          { name: "Iulius Court", pct: 10 },
        ].map((row) => (
          <div key={row.name}>
            <div
              className="flex items-center justify-between"
              style={{ fontSize: 12, marginBottom: 4 }}
            >
              <span style={{ fontWeight: 600 }}>{row.name}</span>
              <span
                className="mono"
                style={{ color: "var(--ink-muted)" }}
              >
                {row.pct}%
              </span>
            </div>
            <div
              style={{
                height: 6,
                borderRadius: 999,
                background: "var(--bg-alt)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${row.pct}%`,
                  height: "100%",
                  background: "var(--accent)",
                  borderRadius: 999,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function MapCard() {
  return (
    <Card variant="card" style={{ padding: 0, overflow: "hidden", boxShadow: "var(--shadow-2)" }}>
      <div
        style={{
          height: 140,
          position: "relative",
          background:
            "linear-gradient(135deg, var(--field-soft) 0%, var(--bg-alt) 100%)",
        }}
      >
        <svg
          viewBox="0 0 200 140"
          width="100%"
          height="100%"
          aria-hidden="true"
          preserveAspectRatio="none"
        >
          <path
            d="M0 90 Q50 70 100 85 T200 80"
            stroke="var(--line-2)"
            strokeWidth="1"
            fill="none"
          />
          <path
            d="M0 60 Q60 40 120 55 T200 50"
            stroke="var(--line)"
            strokeWidth="1"
            fill="none"
          />
          <path
            d="M40 0 L40 140 M120 0 L120 140"
            stroke="var(--line)"
            strokeWidth="0.5"
          />
        </svg>
        {[
          { x: 32, y: 36 },
          { x: 96, y: 70 },
          { x: 152, y: 48 },
        ].map((p, i) => (
          <span
            key={i}
            aria-hidden="true"
            style={{
              position: "absolute",
              left: `${(p.x / 200) * 100}%`,
              top: `${(p.y / 140) * 100}%`,
              transform: "translate(-50%, -100%)",
              color: "var(--accent)",
              filter: "drop-shadow(0 2px 4px rgba(14,26,31,0.18))",
            }}
          >
            <Glyph.pin size={22} />
          </span>
        ))}
      </div>
      <div style={{ padding: 20 }}>
        <div className="flex items-center justify-between">
          <Pill variant="field">Map</Pill>
          <span
            className="mono"
            style={{ fontSize: 11, color: "var(--ink-muted)" }}
          >
            8 venues
          </span>
        </div>
        <div
          className="display mt-3"
          style={{ fontSize: 22, lineHeight: 1.1, letterSpacing: "-0.02em" }}
        >
          Public venues
        </div>
        <div
          className="mono mt-1"
          style={{ fontSize: 12, color: "var(--ink-muted)" }}
        >
          Sorted by distance · weather · price
        </div>
      </div>
    </Card>
  );
}

export function LiveCardsRow() {
  return (
    <section
      className="w-full"
      style={{
        background: "var(--bg)",
        paddingTop: 24,
        paddingBottom: 56,
      }}
    >
      <div
        className="mx-auto w-full px-5 sm:px-8"
        style={{ maxWidth: "var(--page-max)" }}
      >
        <div className="mb-6 flex items-end justify-between">
          <div>
            <span
              className="mono"
              style={{
                fontSize: 11,
                color: "var(--ink-muted)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              What you&apos;ll see
            </span>
            <h2
              className="display mt-2"
              style={{
                fontSize: "clamp(28px, 4vw, 40px)",
                letterSpacing: "-0.025em",
                lineHeight: 1.05,
              }}
            >
              Real product. Real venues.
            </h2>
          </div>
        </div>
        <div
          className="-mx-5 sm:mx-0"
          style={{
            display: "grid",
          }}
        >
          {/* Mobile: horizontal scroll, desktop: 3-up grid */}
          <div
            className="flex gap-4 overflow-x-auto px-5 pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0"
            style={{
              scrollSnapType: "x mandatory",
            }}
          >
            <div
              className="min-w-[260px] max-w-[320px] shrink-0 sm:max-w-none sm:min-w-0"
              style={{ scrollSnapAlign: "start", flex: "0 0 82%" }}
            >
              <FootballCard />
            </div>
            <div
              className="min-w-[260px] max-w-[320px] shrink-0 sm:max-w-none sm:min-w-0"
              style={{ scrollSnapAlign: "start", flex: "0 0 82%" }}
            >
              <TennisCard />
            </div>
            <div
              className="min-w-[260px] max-w-[320px] shrink-0 sm:max-w-none sm:min-w-0"
              style={{ scrollSnapAlign: "start", flex: "0 0 82%" }}
            >
              <MapCard />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
