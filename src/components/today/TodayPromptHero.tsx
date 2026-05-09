"use client";

import { useFormStatus } from "react-dom";
import { Glyph, type GlyphName } from "@/components/ui/Glyph";
import { Pill } from "@/components/ui/Pill";
import { NearbyAvatarRow } from "./NearbyAvatarRow";
import type { SportKey } from "@/lib/sports";

type Props = {
  headline: string;
  subhead: string;
  primarySport?: SportKey;
  yesLabel: string;
  noLabel: string;
  windowLabel: string;
  weatherLabel: string;
  nearbyLabel: string;
};

const SPORT_GLYPH: Partial<Record<SportKey, GlyphName>> = {
  football: "football",
  basketball: "basketball",
  tennis: "tennis",
  volleyball: "volley",
  badminton: "tennis",
  running: "running",
  cycling: "running",
  yoga: "spark",
  hiking: "globe",
  table_tennis: "tennis",
};

function PrimaryIcon({ sport }: { sport?: SportKey }) {
  const name = sport ? SPORT_GLYPH[sport] ?? "football" : "football";
  const Icon = Glyph[name];
  return <Icon size={20} />;
}

function YesButton({ sport, label }: { sport?: SportKey; label: string }) {
  const status = useFormStatus();
  const pending = status.pending && status.data?.get("answer") === "yes";
  return (
    <button
      type="submit"
      name="answer"
      value="yes"
      disabled={status.pending}
      className="inline-flex items-center justify-center gap-2 font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-offset-3 disabled:opacity-70"
      style={{
        background: "var(--accent)",
        color: "var(--on-accent)",
        minHeight: 56,
        borderRadius: 14,
        border: "none",
        cursor: pending ? "wait" : "pointer",
        padding: "0 22px",
        fontSize: 16,
        letterSpacing: "-0.01em",
        width: "100%",
      }}
    >
      <PrimaryIcon sport={sport} />
      {label}
    </button>
  );
}

function NoButton({ label }: { label: string }) {
  const status = useFormStatus();
  return (
    <button
      type="submit"
      name="answer"
      value="no"
      disabled={status.pending}
      className="inline-flex items-center justify-center gap-2 font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-offset-3 disabled:opacity-70"
      style={{
        background: "transparent",
        color: "var(--ink-2)",
        minHeight: 56,
        borderRadius: 14,
        border: "1px solid var(--line)",
        cursor: status.pending ? "wait" : "pointer",
        padding: "0 22px",
        fontSize: 16,
        width: "100%",
      }}
    >
      {label}
    </button>
  );
}

/**
 * State A — fresh prompt.
 * Big "ShowUpToday?" hero with weather chip, two large action buttons,
 * and a nearby-avatars social proof row.
 */
export function TodayPromptHero({
  headline,
  subhead,
  primarySport,
  yesLabel,
  noLabel,
  windowLabel,
  weatherLabel,
  nearbyLabel,
}: Props) {
  // Split last word so we can color it accent — visual blueprint from screens.jsx
  const words = headline.trim().split(/\s+/);
  const last = words.at(-1) ?? headline;
  const lead = words.slice(0, -1).join(" ");

  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: "var(--r-surface)",
        padding: "28px 24px 26px",
        boxShadow: "var(--shadow-3)",
        border: "1px solid var(--line)",
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Pill variant="live">
          <span style={{ fontWeight: 700 }}>{windowLabel}</span>
        </Pill>
        <Pill icon={<Glyph.cloud size={14} />}>{weatherLabel}</Pill>
      </div>
      <div
        className="display"
        style={{
          fontSize: "clamp(48px, 11vw, 72px)",
          lineHeight: 0.95,
          letterSpacing: "-0.045em",
          marginTop: 18,
        }}
      >
        {lead ? <>{lead} </> : null}
        <span style={{ color: "var(--accent)" }}>{last}</span>
      </div>
      <p
        style={{
          fontSize: 15,
          color: "var(--ink-muted)",
          marginTop: 14,
          maxWidth: 320,
          lineHeight: 1.45,
        }}
      >
        {subhead}
      </p>
      <div
        className="grid gap-3 sm:grid-cols-2"
        style={{ marginTop: 22 }}
      >
        <YesButton sport={primarySport} label={yesLabel} />
        <NoButton label={noLabel} />
      </div>
      <div style={{ marginTop: 18 }}>
        <NearbyAvatarRow count={8} label={nearbyLabel} />
      </div>
    </div>
  );
}
