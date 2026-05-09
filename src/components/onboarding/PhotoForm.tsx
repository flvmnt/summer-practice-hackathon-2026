"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AIMark } from "@/components/ui/AIMark";
import { Glyph } from "@/components/ui/Glyph";
import { Skeleton } from "@/components/ui/Skeleton";
import { WizardMobileHeader } from "@/components/onboarding/WizardMobileHeader";
import { WizardStickyActionBar } from "@/components/onboarding/WizardStickyActionBar";
import type { AppLocale } from "@/i18n/routing";
import { type SportKey } from "@/lib/sports";

const SPORT_GLYPHS: Partial<Record<SportKey, keyof typeof Glyph>> = {
  football: "football",
  basketball: "basketball",
  tennis: "tennis",
  volleyball: "volley",
  running: "running",
};

const SPORT_LABELS: Record<SportKey, string> = {
  football: "Football",
  basketball: "Basketball",
  tennis: "Tennis",
  volleyball: "Volleyball",
  badminton: "Badminton",
  running: "Running",
  cycling: "Cycling",
  yoga: "Yoga",
  hiking: "Hiking",
  table_tennis: "Table tennis",
};

type Suggestion = {
  sport: SportKey;
  confidence: number;
  source: string;
};

type AiState = "idle" | "loading" | "ok" | "down";

/**
 * Local stub for photo→sports analysis. Wave 0 audit found no
 * `photoAnalyzeAction` server action wired in `src/lib`. This stub keeps
 * the demo flow visible; a later wave (A11/A12) will swap to real Groq
 * vision via the server action.
 */
function localPhotoAnalyze(): Suggestion[] {
  return [
    { sport: "tennis", confidence: 0.76, source: "from photo" },
    { sport: "running", confidence: 0.62, source: "from photo" },
    { sport: "football", confidence: 0.58, source: "from photo" },
  ];
}

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/heic,image/heif";

export type PhotoFormProps = {
  locale: AppLocale;
  initialPhotoUrl: string | null;
};

export function PhotoForm({ locale, initialPhotoUrl }: PhotoFormProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPhotoUrl);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [aiState, setAiState] = useState<AiState>("idle");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [picked, setPicked] = useState<Set<SportKey>>(new Set());
  const [isPending, startTransition] = useTransition();

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setStatusBanner("Pick an image file (JPG, PNG, or HEIC).");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    // R2 upload route is not yet wired — surface a friendly status banner so
    // the demo flow is honest about what's saved vs. local-preview.
    setStatusBanner("Photo uploads are being wired up — your photo will save in a later step.");
    setAiState("idle");
    setSuggestions([]);
    setPicked(new Set());
  }

  function handleAnalyze() {
    if (!previewUrl) return;
    setAiState("loading");
    setSuggestions([]);
    window.setTimeout(() => {
      try {
        const result = localPhotoAnalyze();
        setSuggestions(result);
        setPicked(new Set(result.slice(0, 2).map((s) => s.sport)));
        setAiState("ok");
      } catch {
        setAiState("down");
      }
    }, 520);
  }

  function togglePick(sport: SportKey) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(sport)) {
        next.delete(sport);
      } else {
        next.add(sport);
      }
      return next;
    });
  }

  function navigate(target: string) {
    startTransition(() => {
      router.push(target);
    });
  }

  function handleSkip() {
    navigate(`/${locale}/today`);
  }

  function handleFinish() {
    // No commit action is wired yet (no `photoAnalyzeAction` /
    // `setUserPhotoAction`). Continue to /today; later waves will persist
    // the picked AI sports + photo URL via the canonical server action.
    navigate(`/${locale}/today`);
  }

  return (
    <div
      className="mx-auto flex w-full max-w-md flex-col"
      style={{ minHeight: "100dvh", background: "var(--bg)" }}
    >
      <div className="flex flex-1 flex-col gap-5 px-5 pt-5 pb-6">
        <WizardMobileHeader
          step={4}
          total={4}
          stepLabel="Step 4 of 4"
          title="Add a photo"
          subtitle="Optional — helps your team recognize you."
        />

        {/* Drop zone */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload a profile photo"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          style={{
            height: 240,
            border: `1px dashed ${dragOver ? "var(--accent)" : "var(--line-2)"}`,
            background: dragOver
              ? "var(--accent-tint)"
              : previewUrl
                ? "var(--surface)"
                : "var(--surface)",
            borderRadius: "var(--r-card)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            position: "relative",
            overflow: "hidden",
            transition:
              "border-color var(--t-1) var(--ease), background var(--t-1) var(--ease)",
          }}
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Profile preview"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 px-5 text-center">
              <span
                aria-hidden
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  background: "var(--accent-tint)",
                  color: "var(--accent-deep)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Glyph.upload size={22} />
              </span>
              <div className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
                Drop a photo here
              </div>
              <div
                className="text-[12px]"
                style={{ color: "var(--ink-muted)" }}
              >
                Optional — JPG, PNG, or HEIC.
              </div>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              // Reset so the same filename can re-trigger.
              e.target.value = "";
            }}
          />
        </div>

        {previewUrl ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="btn-s2m btn-secondary self-start"
            style={{ minHeight: 40, fontSize: 13, padding: "8px 16px" }}
          >
            Choose a different photo
          </button>
        ) : null}

        {statusBanner ? (
          <div
            className="text-[12px]"
            style={{
              color: "var(--ink-muted)",
              background: "var(--surface-2)",
              border: "1px solid var(--line)",
              borderRadius: "var(--r-card)",
              padding: "10px 12px",
              lineHeight: 1.4,
            }}
            role="status"
          >
            {statusBanner}
          </div>
        ) : null}

        {/* AI analyze row */}
        <div className="grid gap-3">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!previewUrl || aiState === "loading"}
            className="btn-s2m"
            style={{
              minHeight: 48,
              fontSize: 14,
              opacity: !previewUrl || aiState === "loading" ? 0.55 : 1,
              cursor:
                !previewUrl || aiState === "loading" ? "not-allowed" : "pointer",
            }}
          >
            <AIMark size={14} />
            <span>
              {aiState === "loading" ? "Reading the photo…" : "Analyze with AI"}
            </span>
          </button>

          {aiState === "loading" ? (
            <div className="flex flex-wrap gap-2" aria-hidden>
              <Skeleton width={92} height={36} radius={12} />
              <Skeleton width={108} height={36} radius={12} />
              <Skeleton width={84} height={36} radius={12} />
            </div>
          ) : null}

          {aiState === "ok" && suggestions.length > 0 ? (
            <div className="grid gap-2">
              <div
                className="mono inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ color: "var(--accent-deep)" }}
              >
                <AIMark size={12} />
                AI picked
              </div>
              <div className="flex flex-wrap gap-x-2 gap-y-3">
                {suggestions.map((suggestion, index) => {
                  const glyphKey = SPORT_GLYPHS[suggestion.sport];
                  const SportGlyph = glyphKey ? Glyph[glyphKey] : Glyph.spark;
                  const isPicked = picked.has(suggestion.sport);
                  const pct = Math.round(suggestion.confidence * 100);
                  return (
                    <div
                      key={suggestion.sport}
                      className="flex flex-col items-center gap-1"
                      style={{
                        animation: `ratchet-in 0.2s var(--ease) ${index * 80}ms backwards`,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => togglePick(suggestion.sport)}
                        aria-pressed={isPicked}
                        className="pill accent"
                        style={{
                          padding: "8px 12px",
                          fontSize: 13,
                          background: isPicked
                            ? "var(--accent)"
                            : "var(--surface)",
                          color: isPicked ? "var(--on-accent)" : "var(--ink)",
                          boxShadow: isPicked
                            ? "none"
                            : "inset 0 0 0 1px var(--accent-soft)",
                          cursor: "pointer",
                          transition: "background var(--t-1) var(--ease)",
                        }}
                      >
                        <SportGlyph size={16} />
                        <span>{SPORT_LABELS[suggestion.sport]}</span>
                        {isPicked ? <Glyph.check size={12} /> : null}
                      </button>
                      <span
                        className="mono text-[10px] font-bold"
                        style={{
                          color: "var(--ink-muted)",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {aiState === "down" ? (
            <div
              style={{
                background: "var(--alert-soft)",
                border:
                  "1px solid color-mix(in oklch, var(--alert) 22%, transparent)",
                borderRadius: "var(--r-card)",
                padding: 14,
              }}
            >
              <div
                className="flex items-center gap-2 text-[13px] font-semibold"
                style={{ color: "var(--alert)" }}
              >
                <Glyph.spark size={14} />
                AI vision is offline.
              </div>
              <p
                className="mt-1 text-[12px]"
                style={{ color: "var(--ink-muted)", lineHeight: 1.4 }}
              >
                We&apos;ll save the photo and you can analyze later.
              </p>
            </div>
          ) : null}
        </div>

        {/* Inline skip on desktop where the sticky bar is less obvious */}
        <button
          type="button"
          onClick={handleSkip}
          className="btn-s2m btn-ghost mx-auto"
          style={{ minHeight: 36, fontSize: 13 }}
        >
          Skip — open Today
        </button>
      </div>

      <WizardStickyActionBar
        secondaryLabel="Skip"
        onSecondary={handleSkip}
        primaryLabel="Finish"
        primaryIcon={<Glyph.check size={14} />}
        onPrimary={handleFinish}
        primaryLoading={isPending}
      />
    </div>
  );
}
