"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AIMark } from "@/components/ui/AIMark";
import { Glyph } from "@/components/ui/Glyph";
import { Skeleton } from "@/components/ui/Skeleton";
import { WizardMobileHeader } from "@/components/onboarding/WizardMobileHeader";
import { WizardStickyActionBar } from "@/components/onboarding/WizardStickyActionBar";
import type { AppLocale } from "@/i18n/routing";
import { extractSportsFromPhotoAction } from "@/lib/photo-actions";
import { type SportKey, SPORT_KEYS } from "@/lib/sports";
import { uploadProfilePhotoAction } from "@/lib/upload-actions";

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
type UploadState = "idle" | "uploading" | "uploaded" | "failed";
type StatusTone = "info" | "alert";

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp";

const SPORT_KEY_SET = new Set<SportKey>(SPORT_KEYS);
function isSportKey(value: string): value is SportKey {
  return SPORT_KEY_SET.has(value as SportKey);
}

export type PhotoFormProps = {
  locale: AppLocale;
  initialPhotoUrl: string | null;
};

export function PhotoForm({ locale, initialPhotoUrl }: PhotoFormProps) {
  const router = useRouter();
  const t = useTranslations("onboarding.photo");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPhotoUrl);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [statusBanner, setStatusBanner] = useState<
    { tone: StatusTone; message: string } | null
  >(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [aiState, setAiState] = useState<AiState>("idle");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [picked, setPicked] = useState<Set<SportKey>>(new Set());
  const [isPending, startTransition] = useTransition();
  // Dropzone is hidden behind a disclosure because the photo step is
  // optional per AGENTS.md and the upload pipeline is still being polished.
  // Surfacing the dropzone behind a clearly labeled toggle keeps the demo
  // honest while preserving the affordance for users who want to try it.
  const [tryUploadOpen, setTryUploadOpen] = useState<boolean>(
    Boolean(initialPhotoUrl),
  );

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setStatusBanner({ tone: "alert", message: t("errorImageType") });
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setPickedFile(file);
    setAiState("idle");
    setSuggestions([]);
    setPicked(new Set());
    setStatusBanner({ tone: "info", message: t("previewOnly") });
    setUploadState("uploading");
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const result = await uploadProfilePhotoAction(formData);
      if (result.ok) {
        setUploadState("uploaded");
        setStatusBanner(null);
      } else {
        setUploadState("failed");
        const message =
          result.error === "too_large"
            ? t("errorTooLarge")
            : result.error === "unsupported_mime"
              ? t("errorUnsupported")
              : t("errorUploadFailed");
        setStatusBanner({ tone: "alert", message });
      }
    } catch {
      setUploadState("failed");
      setStatusBanner({ tone: "alert", message: t("errorUploadFailed") });
    }
  }

  async function handleAnalyze() {
    if (!pickedFile) {
      setStatusBanner({ tone: "alert", message: t("errorNoFile") });
      return;
    }
    setAiState("loading");
    setSuggestions([]);
    try {
      const formData = new FormData();
      formData.append("photo", pickedFile);
      const result = await extractSportsFromPhotoAction(formData);
      if (!result.ok) {
        setAiState("down");
        setStatusBanner({ tone: "alert", message: t("aiUnavailable") });
        return;
      }
      const mapped: Suggestion[] = result.suggestions
        .filter((s) => isSportKey(s.sport))
        .map((s) => ({
          sport: s.sport as SportKey,
          confidence: s.confidence,
          source: result.source === "ai" ? "from photo" : "fallback hint",
        }));
      if (mapped.length === 0) {
        setAiState("down");
        setStatusBanner({ tone: "alert", message: t("aiUnavailable") });
        return;
      }
      setSuggestions(mapped);
      setPicked(new Set(mapped.slice(0, 2).map((s) => s.sport)));
      setAiState("ok");
      setStatusBanner(null);
    } catch {
      setAiState("down");
      setStatusBanner({ tone: "alert", message: t("aiUnavailable") });
    }
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
    // Photo is optional per AGENTS.md - Finish always continues to /today.
    // The upload (when staged) was already kicked off in `handleFile`, so
    // we don't trigger another mutation here.
    navigate(`/${locale}/today`);
  }

  // Suppress lint: uploadState is the source of truth for whether to gate
  // any future UI; for now the status banner consumes it indirectly.
  void uploadState;

  return (
    <div
      className="mx-auto flex w-full max-w-md flex-col"
      style={{ minHeight: "100dvh", background: "var(--bg)" }}
    >
      <div className="flex flex-1 flex-col gap-5 px-5 pt-5 pb-32">
        <WizardMobileHeader
          step={4}
          total={4}
          stepLabel={t("stepLabel")}
          title={t("title")}
          subtitle={t("subtitle")}
        />

        {/* Honest skip-friendly empty state. Photo is optional per
            AGENTS.md, so the Skip path is the obvious primary action. This
            replaces the older "Photo uploads are being wired up" banner. */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "var(--r-card)",
            padding: 18,
            display: "grid",
            gap: 14,
          }}
        >
          <div className="grid gap-1.5">
            <div
              className="text-[15px] font-semibold"
              style={{ color: "var(--ink)", letterSpacing: "-0.01em" }}
            >
              {t("optionalTitle")}
            </div>
            <p
              className="text-[13px]"
              style={{ color: "var(--ink-muted)", lineHeight: 1.45 }}
            >
              {t("optionalBody")}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSkip}
            className="btn-s2m"
            style={{ minHeight: 48, fontSize: 14, width: "100%" }}
          >
            <span>{t("skipPrimary")}</span>
            <Glyph.arrow size={14} />
          </button>
        </div>

        {/* "Try the upload" disclosure. Keeps the dropzone affordance
            available for demos while staying honest about the staging
            state. The label and description make the optionality clear. */}
        <div className="grid gap-3">
          <button
            type="button"
            onClick={() => setTryUploadOpen((prev) => !prev)}
            aria-expanded={tryUploadOpen}
            aria-controls="photo-try-upload-panel"
            className="btn-s2m btn-ghost"
            style={{
              minHeight: 44,
              fontSize: 13,
              justifyContent: "space-between",
              padding: "10px 14px",
              boxShadow: "inset 0 0 0 1px var(--line)",
              borderRadius: "var(--r-card)",
              color: "var(--ink-2)",
            }}
          >
            <span className="inline-flex items-center gap-2">
              <Glyph.upload size={14} />
              <span>{t("tryUploadLabel")}</span>
            </span>
            <span
              aria-hidden
              style={{
                display: "inline-flex",
                transition: "transform var(--t-1) var(--ease)",
                transform: tryUploadOpen ? "rotate(90deg)" : "rotate(0deg)",
              }}
            >
              <Glyph.chevron size={14} />
            </span>
          </button>

          {tryUploadOpen ? (
            <div
              id="photo-try-upload-panel"
              className="grid gap-4"
              style={{ animation: "ratchet-in 0.18s var(--ease)" }}
            >
              <p
                className="text-[12px]"
                style={{ color: "var(--ink-muted)", lineHeight: 1.45 }}
              >
                {t("tryUploadDescription")}
              </p>

              {/* Drop zone */}
              <div
                role="button"
                tabIndex={0}
                aria-label={t("chooseFile")}
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
                  height: 220,
                  border: `1px dashed ${
                    dragOver ? "var(--accent)" : "var(--line-2)"
                  }`,
                  background: dragOver
                    ? "var(--accent-tint)"
                    : previewUrl
                      ? "var(--surface)"
                      : "var(--surface-2)",
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
                    <div
                      className="text-[14px] font-semibold"
                      style={{ color: "var(--ink)" }}
                    >
                      {t("dropZoneTitle")}
                    </div>
                    <div
                      className="text-[12px]"
                      style={{ color: "var(--ink-muted)" }}
                    >
                      {t("dropZoneSub")}
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

              {/* >=44px choose-file CTA. Visible whether or not a photo is
                  staged so users who don't realize the dropzone is tappable
                  still have a clear, accessible action. */}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="btn-s2m btn-secondary self-start"
                style={{ minHeight: 44, fontSize: 13, padding: "10px 18px" }}
              >
                {previewUrl ? t("changePhoto") : t("chooseFile")}
              </button>

              {statusBanner ? (
                <div
                  className="text-[12px]"
                  style={{
                    color:
                      statusBanner.tone === "alert"
                        ? "var(--alert)"
                        : "var(--ink-2)",
                    background:
                      statusBanner.tone === "alert"
                        ? "var(--alert-soft)"
                        : "var(--surface-2)",
                    border: `1px solid ${
                      statusBanner.tone === "alert"
                        ? "color-mix(in oklch, var(--alert) 22%, transparent)"
                        : "var(--line)"
                    }`,
                    borderRadius: "var(--r-card)",
                    padding: "10px 14px",
                    lineHeight: 1.45,
                  }}
                  role="status"
                >
                  {statusBanner.message}
                </div>
              ) : null}

              {/* AI analyze row */}
              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={!pickedFile || aiState === "loading"}
                  aria-busy={aiState === "loading"}
                  className="btn-s2m"
                  style={{
                    minHeight: 48,
                    fontSize: 14,
                    opacity:
                      !pickedFile || aiState === "loading" ? 0.55 : 1,
                    cursor:
                      !pickedFile || aiState === "loading"
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  <AIMark size={14} />
                  <span>
                    {aiState === "loading" ? t("analyzing") : t("analyze")}
                  </span>
                </button>

                {aiState === "loading" ? (
                  <div className="flex flex-wrap gap-2" aria-hidden>
                    <Skeleton width={92} height={36} radius={10} />
                    <Skeleton width={108} height={36} radius={10} />
                    <Skeleton width={84} height={36} radius={10} />
                  </div>
                ) : null}

                {aiState === "ok" && suggestions.length > 0 ? (
                  <div className="grid gap-2">
                    <div
                      className="mono inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                      style={{ color: "var(--accent-deep)" }}
                    >
                      <AIMark size={12} />
                      {t("aiPicked")}
                    </div>
                    <div className="flex flex-wrap gap-x-2 gap-y-3">
                      {suggestions.map((suggestion, index) => {
                        const glyphKey = SPORT_GLYPHS[suggestion.sport];
                        const SportGlyph = glyphKey
                          ? Glyph[glyphKey]
                          : Glyph.spark;
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
                                color: isPicked
                                  ? "var(--on-accent)"
                                  : "var(--ink)",
                                boxShadow: isPicked
                                  ? "none"
                                  : "inset 0 0 0 1px var(--accent-soft)",
                                cursor: "pointer",
                                transition:
                                  "background var(--t-1) var(--ease)",
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
                      {t("aiPaused")}
                    </div>
                    <p
                      className="mt-1 text-[12px]"
                      style={{ color: "var(--ink-muted)", lineHeight: 1.4 }}
                    >
                      {t("aiPausedSub")}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <WizardStickyActionBar
        secondaryLabel={t("skip")}
        onSecondary={handleSkip}
        primaryLabel={t("finish")}
        primaryIcon={<Glyph.check size={14} />}
        onPrimary={handleFinish}
        primaryLoading={isPending}
      />
    </div>
  );
}
