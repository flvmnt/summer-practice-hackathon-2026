"use client";

import { useEffect, useState } from "react";
import { AIMark } from "@/components/ui/AIMark";
import { Glyph } from "@/components/ui/Glyph";
import { Pill } from "@/components/ui/Pill";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { TypeOn } from "@/components/event/TypeOn";
import { VenueRow } from "@/components/event/VenueRow";

export type CaptainAutoEventRevealCopy = {
  pillLabel: string; // "Captain auto-suggest"
  versionLabel: string; // "auto · v1"
  headline: string; // "Suggested plan"
  whenRange: string; // "Today, 19:00 – 20:30"
  reasoning: string; // text for TypeOn (50ms/char per spec)
  recommendedSubLine: string; // "X km · price · weather"
  alternateLines: string[]; // small list of fallback rows (sub copy)
  alternateNames: string[]; // names for fallback rows
  confirmPlan: string;
  startVote: string;
  suggestSomethingElse: string;
  suggestSomethingElseToast: string;
  confirmedToast: string;
};

type Props = {
  copy: CaptainAutoEventRevealCopy;
  /** Render-gating signals (parent decides; this component just opens). */
  isCaptain: boolean;
  status: string; // "proposed" | "confirmed" | "cancelled"
  eventId: string;
  /** Recommended (rank 1) venue. */
  primaryVenue: {
    name: string;
    fit: "outdoor_good" | "indoor_recommended" | "wind_warning" | "cold_warning";
  } | null;
  /** Switch the parent's tabs to the vote panel. */
  onStartVote: () => void;
};

const DISMISS_KEY_PREFIX = "s2m:captain-reveal-dismissed:";

function weatherGlyphFor(
  fit: "outdoor_good" | "indoor_recommended" | "wind_warning" | "cold_warning",
) {
  switch (fit) {
    case "outdoor_good":
      return <Glyph.sun size={18} />;
    case "indoor_recommended":
      return <Glyph.rain size={18} />;
    case "wind_warning":
      return <Glyph.wind size={18} />;
    case "cold_warning":
      return <Glyph.cloud size={18} />;
  }
}

/**
 * Cinematic captain pre-confirm sheet — only renders when the current user is
 * the group captain and the event is still `proposed`. First visit auto-opens
 * (one-time, persisted to localStorage by event id). Confirm is the only path
 * with the `var(--accent)` pulse so the eye lands there.
 *
 * The actual `confirmEventAction` is owned by the events lib agent. Until that
 * lands we surface a success toast so the demo flow stays believable; the
 * shape of the click handler will not change when it does.
 */
export function CaptainAutoEventReveal({
  copy,
  isCaptain,
  status,
  eventId,
  primaryVenue,
  onStartVote,
}: Props) {
  // Initialize dismissed lazily from localStorage so we don't have to set
  // state inside the effect (and avoid SSR hydration mismatches).
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return (
        window.localStorage.getItem(`${DISMISS_KEY_PREFIX}${eventId}`) === "1"
      );
    } catch {
      return false;
    }
  });
  const [open, setOpen] = useState(false);
  const toast = useToast();

  const eligible = isCaptain && status === "proposed";

  // First-visit auto-open on next paint so the slide animation runs.
  useEffect(() => {
    if (!eligible || dismissed) return;
    const id = window.requestAnimationFrame(() => setOpen(true));
    return () => window.cancelAnimationFrame(id);
  }, [dismissed, eligible]);

  const dismiss = () => {
    setOpen(false);
    setDismissed(true);
    try {
      window.localStorage.setItem(`${DISMISS_KEY_PREFIX}${eventId}`, "1");
    } catch {
      // Best-effort only; if storage is unavailable we still close.
    }
  };

  const onConfirm = () => {
    toast.push({
      title: copy.confirmedToast,
      variant: "success",
    });
    dismiss();
  };

  const onVote = () => {
    onStartVote();
    dismiss();
  };

  const onSuggest = () => {
    toast.push({ title: copy.suggestSomethingElseToast });
  };

  if (!eligible || dismissed) return null;

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) dismiss();
        else setOpen(true);
      }}
      ariaLabel={copy.headline}
    >
      <div style={{ padding: "8px 22px 22px" }}>
        <div className="flex items-center gap-2">
          <Pill variant="accent" icon={<AIMark size={12} />}>
            {copy.pillLabel}
          </Pill>
          <span
            className="mono ml-auto text-[11px]"
            style={{ color: "var(--ink-muted)" }}
          >
            {copy.versionLabel}
          </span>
        </div>

        <div
          className="display"
          style={{ fontSize: 28, marginTop: 14, lineHeight: 1.1 }}
        >
          {copy.headline}
        </div>
        <p
          className="mono mt-1 text-[12px]"
          style={{ color: "var(--ink-muted)" }}
        >
          {copy.whenRange}
        </p>

        {/* Why this works — TypeOn at 50ms/char per spec */}
        <TypeOn text={copy.reasoning} active speedMs={50} />

        {/* Venue rows */}
        <div className="mt-3 grid gap-2">
          {primaryVenue ? (
            <VenueRow
              name={primaryVenue.name}
              sub={copy.recommendedSubLine}
              weather={weatherGlyphFor(primaryVenue.fit)}
              primary
            />
          ) : null}
          {copy.alternateNames.map((name, idx) => (
            <VenueRow
              key={name}
              name={name}
              sub={copy.alternateLines[idx]}
              weather={<Glyph.cloud size={18} />}
            />
          ))}
        </div>

        {/* Buttons */}
        <div
          className="mt-4 grid gap-2"
          style={{ gridTemplateColumns: "1fr 1.3fr" }}
        >
          <button
            type="button"
            onClick={onVote}
            className="btn-s2m btn-secondary"
            style={{ minHeight: 44, padding: "10px 14px", fontSize: 14 }}
          >
            {copy.startVote}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn-s2m"
            style={{
              minHeight: 44,
              padding: "10px 14px",
              fontSize: 14,
              animation:
                "s2m-confirm-pulse 1800ms cubic-bezier(0.22,0.61,0.36,1) 600ms 1",
            }}
          >
            <Glyph.check size={16} />
            {copy.confirmPlan}
          </button>
        </div>

        <button
          type="button"
          onClick={onSuggest}
          className="btn-s2m btn-ghost mt-2"
          style={{ width: "100%", minHeight: 40, fontSize: 13 }}
        >
          {copy.suggestSomethingElse}
        </button>
      </div>
      {/* keyframes inline so we don't need to touch globals.css */}
      <style>{`
        @keyframes s2m-confirm-pulse {
          0%   { box-shadow: 0 1px 0 rgba(0,0,0,0.08), 0 4px 14px -4px color-mix(in oklch, var(--accent) 40%, transparent), 0 0 0 0 color-mix(in oklch, var(--accent) 70%, transparent); }
          60%  { box-shadow: 0 1px 0 rgba(0,0,0,0.08), 0 4px 14px -4px color-mix(in oklch, var(--accent) 40%, transparent), 0 0 0 12px color-mix(in oklch, var(--accent) 0%, transparent); }
          100% { box-shadow: 0 1px 0 rgba(0,0,0,0.08), 0 4px 14px -4px color-mix(in oklch, var(--accent) 40%, transparent), 0 0 0 0 color-mix(in oklch, var(--accent) 0%, transparent); }
        }
      `}</style>
    </Sheet>
  );
}
