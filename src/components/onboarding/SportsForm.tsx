"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Glyph } from "@/components/ui/Glyph";
import { WizardMobileHeader } from "@/components/onboarding/WizardMobileHeader";
import { WizardStickyActionBar } from "@/components/onboarding/WizardStickyActionBar";
import type { AppLocale } from "@/i18n/routing";
import {
  onboardingSportsFormAction,
  type OnboardingSportsFormState,
} from "@/lib/onboarding-form-actions";
import type { SportKey } from "@/lib/sports";

type SportsFormCopy = {
  submit: string;
  pending: string;
  genericError: string;
  unauthorized: string;
  sportsRequired: string;
  successTitle: string;
  successBody: string;
  continue: string;
  levels: Record<string, string>;
  sports: Record<string, string>;
};

export type AiSuggestionsCopy = {
  label: string;
  hint: string;
};

// Direction B canvas tile sports - 6 tiles, 3×2 mobile, 6×1 desktop.
const TILE_SPORTS = [
  { key: "football" as SportKey, glyph: Glyph.football, label: "Football" },
  { key: "basketball" as SportKey, glyph: Glyph.basketball, label: "Basketball" },
  { key: "tennis" as SportKey, glyph: Glyph.tennis, label: "Tennis" },
  { key: "padel" as const, glyph: Glyph.padel, label: "Padel" },
  { key: "running" as SportKey, glyph: Glyph.running, label: "Running" },
  { key: "volleyball" as SportKey, glyph: Glyph.volley, label: "Volley" },
] as const;

// Padel isn't in SPORT_KEYS yet; map to a supported sport on submit.
// Schema is locked, so silently fall back to football for padel - that matches
// the deterministic-first rule (no fake sports surfaced to matching).
const SUBMIT_SPORT: Record<string, SportKey> = {
  football: "football",
  basketball: "basketball",
  tennis: "tennis",
  padel: "tennis", // fallback to tennis (court sport) until schema adds padel
  running: "running",
  volleyball: "volleyball",
};

// Reverse: canonical SportKey → display tile key. Suggestions arrive as
// canonical keys; we surface them via the existing tile grid only when a
// matching tile exists. Sports without a tile (yoga, hiking, badminton,
// cycling, table_tennis) are dropped from the suggestion strip.
const TILE_FROM_SPORT: Partial<Record<SportKey, (typeof TILE_SPORTS)[number]["key"]>> = {
  football: "football",
  basketball: "basketball",
  tennis: "tennis",
  volleyball: "volleyball",
  running: "running",
};

type LevelTier = "beginner" | "casual" | "pro";
const LEVEL_TIERS: ReadonlyArray<{ value: LevelTier; label: string; numeric: 1 | 3 | 5 }> = [
  { value: "beginner", label: "Beginner", numeric: 1 },
  { value: "casual", label: "Casual", numeric: 3 },
  { value: "pro", label: "Pro", numeric: 5 },
];

function tierFromNumeric(n: number): LevelTier {
  if (n <= 2) return "beginner";
  if (n >= 4) return "pro";
  return "casual";
}

function errorText(code: string | undefined, copy: SportsFormCopy) {
  if (code === "sports_required" || code === "validation") {
    return copy.sportsRequired;
  }
  if (code === "unauthorized") return copy.unauthorized;
  if (code) return copy.genericError;
  return undefined;
}

const initialState: OnboardingSportsFormState = {};

export function SportsForm({
  copy,
  defaultSports,
  locale,
  suggestedSports,
  aiSuggestionsCopy,
}: {
  copy: SportsFormCopy;
  defaultSports: Array<{ sport: SportKey; level: number }>;
  locale: AppLocale;
  suggestedSports?: SportKey[];
  aiSuggestionsCopy?: AiSuggestionsCopy;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<OnboardingSportsFormState>(initialState);

  // Map of selected display key -> tier. Seed from existing user sports.
  const [selected, setSelected] = useState<Record<string, LevelTier>>(() => {
    const initial: Record<string, LevelTier> = {};
    for (const entry of defaultSports) {
      initial[entry.sport] = tierFromNumeric(entry.level);
    }
    return initial;
  });

  // Resolve AI suggestions to renderable tile entries. Cap at 3 (already capped
  // upstream, but defensive). De-duplicate against tile keys.
  const aiSuggestionTiles = useMemo(() => {
    if (!suggestedSports || suggestedSports.length === 0) return [];
    const seenKeys = new Set<string>();
    const tiles: Array<(typeof TILE_SPORTS)[number]> = [];
    for (const sport of suggestedSports) {
      const tileKey = TILE_FROM_SPORT[sport];
      if (!tileKey || seenKeys.has(tileKey)) continue;
      const tile = TILE_SPORTS.find((t) => t.key === tileKey);
      if (!tile) continue;
      seenKeys.add(tileKey);
      tiles.push(tile);
      if (tiles.length >= 3) break;
    }
    return tiles;
  }, [suggestedSports]);

  const selectedKeys = useMemo(() => Object.keys(selected), [selected]);
  const canContinue = selectedKeys.length > 0 && !pending;

  useEffect(() => {
    if (state.saved) {
      router.push(`/${locale}/onboarding/location`);
    }
  }, [state.saved, locale, router]);

  function toggleSport(key: string) {
    setSelected((prev) => {
      const next = { ...prev };
      if (key in next) {
        delete next[key];
      } else {
        next[key] = "casual";
      }
      return next;
    });
  }

  function setTier(key: string, tier: LevelTier) {
    setSelected((prev) => (key in prev ? { ...prev, [key]: tier } : prev));
  }

  function submit() {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    startTransition(async () => {
      const result = await onboardingSportsFormAction(initialState, fd);
      setState(result);
    });
  }

  const formError = errorText(state.fieldErrors?.sports ?? state.error, copy);

  return (
    <div className="flex w-full flex-col">
      <WizardMobileHeader
        step={2}
        total={4}
        title="Choose sports"
        subtitle="Pick what you like to play"
      />

      <form ref={formRef} className="contents" action={() => submit()}>
        {/* Hidden inputs that mirror the selection state for the server action. */}
        {selectedKeys.map((key) => {
          const tier = selected[key];
          const tierDef = LEVEL_TIERS.find((t) => t.value === tier) ?? LEVEL_TIERS[1];
          const submitKey = SUBMIT_SPORT[key] ?? (key as SportKey);
          return (
            <div key={`hidden-${key}`} hidden>
              <input name="sports" type="hidden" value={submitKey} />
              <input
                name={`${submitKey}Level`}
                type="hidden"
                value={String(tierDef.numeric)}
              />
            </div>
          );
        })}

        {/* AI-suggested sports row - shown only when bio yielded matches */}
        {aiSuggestionTiles.length > 0 ? (
          <div className="mt-5 flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <span
                className="mono text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ color: "var(--accent-deep)" }}
              >
                {aiSuggestionsCopy?.label ?? "Suggested for you"}
              </span>
              {aiSuggestionsCopy?.hint ? (
                <span
                  className="text-[11px]"
                  style={{ color: "var(--ink-muted)" }}
                >
                  {aiSuggestionsCopy.hint}
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {aiSuggestionTiles.map((tile) => {
                const Icon = tile.glyph;
                const isActive = tile.key in selected;
                return (
                  <button
                    key={`ai-${tile.key}`}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => toggleSport(tile.key)}
                    className="pill accent"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      fontSize: 13,
                      fontWeight: 600,
                      background: isActive ? "var(--accent)" : "var(--surface)",
                      color: isActive ? "var(--on-accent)" : "var(--accent-deep)",
                      border: isActive
                        ? "1.5px solid var(--accent)"
                        : "1.5px solid var(--accent-soft)",
                      borderRadius: 999,
                      cursor: "pointer",
                      transition: "background var(--t-1) var(--ease)",
                    }}
                  >
                    <Icon size={16} />
                    <span>{tile.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Sport tile grid */}
        <div
          className="mt-5 grid gap-2"
          style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
        >
          {TILE_SPORTS.map((sport) => {
            const isActive = sport.key in selected;
            const Icon = sport.glyph;
            return (
              <button
                key={sport.key}
                type="button"
                aria-pressed={isActive}
                onClick={() => toggleSport(sport.key)}
                className="sport-tile"
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "14px 10px 12px",
                  minHeight: 88,
                  borderRadius: 14,
                  background: isActive ? "var(--accent-soft)" : "var(--surface)",
                  border: isActive
                    ? "2px solid var(--accent)"
                    : "1.5px solid var(--line-2)",
                  color: isActive ? "var(--accent-deep)" : "var(--ink-muted)",
                  cursor: "pointer",
                  transition: "background var(--t-2) var(--ease), border-color var(--t-2) var(--ease)",
                  textAlign: "center",
                }}
              >
                <Icon size={28} />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--ink)",
                    lineHeight: 1.1,
                  }}
                >
                  {sport.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Per-sport level tiers */}
        {selectedKeys.length > 0 ? (
          <div className="mt-5 flex flex-col gap-2.5">
            {selectedKeys.map((key) => {
              const sport = TILE_SPORTS.find((s) => s.key === key);
              if (!sport) return null;
              const Icon = sport.glyph;
              return (
                <div
                  key={`row-${key}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr",
                    gap: 10,
                    alignItems: "center",
                    padding: "10px 12px",
                    background: "var(--surface)",
                    border: "1px solid var(--line)",
                    borderRadius: 12,
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 10px",
                      borderRadius: 999,
                      background: "var(--accent-tint)",
                      color: "var(--accent-deep)",
                      fontSize: 13,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Icon size={16} />
                    {sport.label}
                  </span>
                  <SegmentedControl<LevelTier>
                    options={LEVEL_TIERS.map((t) => ({ value: t.value, label: t.label }))}
                    value={selected[key]}
                    onChange={(next) => setTier(key, next)}
                    size="sm"
                    ariaLabel={`Level for ${sport.label}`}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <p
            className="mt-5"
            style={{ fontSize: 13, color: "var(--ink-muted)" }}
          >
            Select at least one sport to continue.
          </p>
        )}

        {formError ? (
          <p
            className="mt-3 rounded-md px-3 py-2 text-sm font-semibold"
            role="alert"
            style={{
              background: "color-mix(in oklch, var(--accent) 10%, transparent)",
              color: "var(--accent-deep)",
              border: "1px solid color-mix(in oklch, var(--accent) 30%, transparent)",
            }}
          >
            {formError}
          </p>
        ) : null}

        <div className="h-24" aria-hidden="true" />
      </form>

      <WizardStickyActionBar
        primaryLabel={pending ? copy.pending : "Next"}
        primaryDisabled={!canContinue}
        primaryLoading={pending}
        onPrimary={submit}
        secondaryLabel="Back"
        secondaryHref={`/${locale}/onboarding/profile`}
      />
    </div>
  );
}
