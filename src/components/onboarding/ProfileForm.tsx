"use client";

import Image from "next/image";
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Camera } from "lucide-react";
import { AIMark } from "@/components/ui/AIMark";
import { Glyph } from "@/components/ui/Glyph";
import { Skeleton } from "@/components/ui/Skeleton";
import { WizardMobileHeader } from "@/components/onboarding/WizardMobileHeader";
import { WizardStickyActionBar } from "@/components/onboarding/WizardStickyActionBar";
import type { AppLocale } from "@/i18n/routing";
import {
  extractSportsForCurrentUserAction,
  extractSportsFromBioTextAction,
} from "@/lib/ai-actions";
import { updateOnboardingProfileAction } from "@/lib/onboarding";
import { uploadProfilePhotoAction } from "@/lib/upload-actions";
import { SPORT_KEYS, type SportKey } from "@/lib/sports";

const ACCEPTED_PHOTO_TYPES = "image/jpeg,image/png,image/webp";

const BIO_MAX = 240;
const NAME_MAX = 80;

/**
 * Sport key → glyph map. Restricted to keys that have a matching
 * `Glyph.<key>` entry. Other sports fall back to the generic chevron-burst.
 */
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
};

type AiState = "idle" | "loading" | "ok" | "down";

function fieldErrorText(code: string | undefined) {
  if (!code) return undefined;
  if (code === "full_name_required" || code === "full_name_too_long") {
    return "Enter your full name to continue.";
  }
  if (code === "invalid_full_name") {
    return "Use letters, spaces, apostrophes, or hyphens.";
  }
  if (code === "bio_required") {
    return "Add a short bio before continuing.";
  }
  return "Please review this field.";
}

export type ProfileFormProps = {
  defaultBio: string;
  defaultFullName: string;
  defaultPhotoUrl?: string | null;
  username: string;
  locale: AppLocale;
};

type PhotoUploadState = "idle" | "uploading" | "uploaded" | "failed";

export function ProfileForm({
  defaultBio,
  defaultFullName,
  defaultPhotoUrl = null,
  username,
  locale,
}: ProfileFormProps) {
  const router = useRouter();
  const t = useTranslations("onboarding.profile");
  const [fullName, setFullName] = useState(defaultFullName ?? "");
  const [bio, setBio] = useState(defaultBio ?? "");
  const [fullNameError, setFullNameError] = useState<string | undefined>();
  const [bioError, setBioError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();

  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(defaultPhotoUrl);
  const [photoStatus, setPhotoStatus] = useState<PhotoUploadState>("idle");
  const [photoError, setPhotoError] = useState<string | undefined>();

  const [aiState, setAiState] = useState<AiState>("idle");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [picked, setPicked] = useState<Set<SportKey>>(new Set());
  const [isPending, startTransition] = useTransition();

  async function handlePhotoFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setPhotoError(t("photoErrorType"));
      return;
    }
    setPhotoError(undefined);
    setPhotoUrl(URL.createObjectURL(file));
    setPhotoStatus("uploading");
    try {
      const fd = new FormData();
      fd.append("photo", file);
      const result = await uploadProfilePhotoAction(fd);
      if (result.ok) {
        setPhotoStatus("uploaded");
        if (result.data?.photoUrl) setPhotoUrl(result.data.photoUrl);
      } else {
        setPhotoStatus("failed");
        setPhotoError(t("photoErrorUpload"));
      }
    } catch {
      setPhotoStatus("failed");
      setPhotoError(t("photoErrorUpload"));
    }
  }

  const remaining = useMemo(() => Math.max(0, BIO_MAX - bio.length), [bio]);
  const bioOverLimit = bio.length > BIO_MAX;

  function handleSuggest() {
    if (!bio.trim()) {
      setBioError(t("bioRequired"));
      return;
    }
    setBioError(undefined);
    setAiState("loading");
    setSuggestions([]);
    startTransition(async () => {
      const result = await extractSportsFromBioTextAction({ bio });
      if (result.ok) {
        const next = result.suggestions
          .filter((suggestion) => SPORT_KEYS.includes(suggestion.sport))
          .slice(0, 4)
          .map((suggestion) => ({
            sport: suggestion.sport,
            confidence: suggestion.confidence,
          }));
        setSuggestions(next);
        setPicked(new Set(next.slice(0, 2).map((suggestion) => suggestion.sport)));
        setAiState("ok");
      } else {
        setAiState("down");
      }
    });
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

  function handleNext() {
    setFormError(undefined);
    setFullNameError(undefined);
    setBioError(undefined);

    const trimmedName = fullName.trim();
    const trimmedBio = bio.trim();

    if (!trimmedName) {
      setFullNameError(t("fullNameRequired"));
      return;
    }
    if (!trimmedBio) {
      setBioError(t("bioRequired"));
      return;
    }
    if (bioOverLimit) {
      setBioError(`Keep your bio under ${BIO_MAX} characters.`);
      return;
    }

    startTransition(async () => {
      const result = await updateOnboardingProfileAction({
        fullName: trimmedName,
        bio: trimmedBio,
      });
      if (!result.ok) {
        const fieldErrors = result.fieldErrors ?? {};
        const nameMsg = fieldErrorText(fieldErrors.fullName);
        const bioMsg = fieldErrorText(fieldErrors.bio);
        setFullNameError(nameMsg);
        setBioError(bioMsg);
        if (!nameMsg && !bioMsg) {
          setFormError(
            result.error === "unauthorized"
              ? t("unauthorized")
              : t("genericError"),
          );
        }
        return;
      }
      // Persist sport suggestions for the next step via a query param. We
      // prefer client-picked sports (the user actively confirmed those by
      // tapping); otherwise we fire the server-side AI extraction so the
      // bio→sport signal still surfaces. Failures here must NOT block the
      // hop to /onboarding/sports.
      let suggested: SportKey[] = [...picked];
      if (suggested.length === 0) {
        try {
          const ai = await extractSportsForCurrentUserAction();
          if (ai.ok && ai.suggestions.length > 0) {
            suggested = ai.suggestions
              .slice()
              .sort((a, b) => b.confidence - a.confidence)
              .slice(0, 3)
              .map((entry) => entry.sport)
              .filter((sport): sport is SportKey =>
                SPORT_KEYS.includes(sport),
              );
          }
        } catch {
          // Swallow - proceed without suggestions.
        }
      }

      const query =
        suggested.length > 0 ? `?suggested=${suggested.join(",")}` : "";
      router.push(`/${locale}/onboarding/sports${query}`);
    });
  }

  return (
    <div
      className="mx-auto flex w-full max-w-md flex-col"
      style={{ minHeight: "100dvh", background: "var(--bg)" }}
    >
      <div className="flex flex-1 flex-col gap-5 px-5 pt-5 pb-32">
        <WizardMobileHeader
          step={1}
          total={3}
          stepLabel={t("stepLabel")}
          title={t("title")}
          subtitle={t("subtitle")}
        />

        {/* Profile photo (merged from former step 4) */}
        <div className="mt-2 grid gap-2">
          <span
            className="mono text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: "var(--ink-muted)" }}
          >
            {t("photoLabel")}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              aria-label={t("photoUpload")}
              style={{
                position: "relative",
                width: 76,
                height: 76,
                borderRadius: "50%",
                border: "2px dashed var(--line-2)",
                background: photoUrl ? "transparent" : "var(--surface-2)",
                cursor: "pointer",
                overflow: "hidden",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--ink-muted)",
              }}
            >
              {photoUrl ? (
                <Image
                  src={photoUrl}
                  alt=""
                  fill
                  sizes="76px"
                  style={{ objectFit: "cover" }}
                  unoptimized
                />
              ) : (
                <Camera size={22} aria-hidden />
              )}
            </button>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                {photoStatus === "uploading"
                  ? t("photoUploading")
                  : photoStatus === "uploaded"
                    ? t("photoUploaded")
                    : t("photoOptional")}
              </span>
              <div className="flex flex-wrap gap-3 text-[12px]">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="font-semibold underline-offset-2 hover:underline"
                  style={{ color: "var(--accent-deep)" }}
                >
                  {photoUrl ? t("photoChange") : t("photoUpload")}
                </button>
              </div>
              {photoError ? (
                <span className="text-[12px]" style={{ color: "var(--alert)" }}>
                  {photoError}
                </span>
              ) : null}
            </div>
          </div>
          <input
            ref={photoInputRef}
            type="file"
            accept={ACCEPTED_PHOTO_TYPES}
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePhotoFile(file);
            }}
          />
        </div>

        {/* Full name */}
        <div className="mt-2 grid gap-1.5">
          <label
            htmlFor="profile-full-name"
            className="mono text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: "var(--ink-muted)" }}
          >
            {t("fullName")}
          </label>
          <input
            id="profile-full-name"
            name="fullName"
            type="text"
            autoComplete="name"
            maxLength={NAME_MAX}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={t("fullNamePlaceholder")}
            className="w-full text-[16px] leading-snug border-[1.5px] focus:outline-none"
            style={{
              padding: "12px 14px",
              background: "var(--surface)",
              color: "var(--ink)",
              borderColor: fullNameError ? "var(--alert)" : "var(--line)",
              borderRadius: "var(--r-card)",
              minHeight: 48,
              transition: "border-color var(--t-1) var(--ease)",
            }}
            aria-invalid={fullNameError ? true : undefined}
            aria-describedby={fullNameError ? "profile-full-name-err" : undefined}
          />
          {fullNameError ? (
            <p
              id="profile-full-name-err"
              className="text-[12px]"
              style={{ color: "var(--alert)" }}
            >
              {fullNameError}
            </p>
          ) : null}
        </div>

        {/* Username readonly chip */}
        <div className="grid gap-1.5">
          <span
            className="mono text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: "var(--ink-muted)" }}
          >
            {t("usernameLabel")}
          </span>
          <div
            className="inline-flex items-center gap-2 self-start px-3 py-2 text-[13px] font-semibold"
            style={{
              background: "var(--surface-2)",
              color: "var(--ink)",
              borderRadius: 999,
              border: "1px solid var(--line)",
            }}
          >
            <span aria-hidden style={{ color: "var(--ink-muted)" }}>
              @
            </span>
            <span>{username}</span>
          </div>
        </div>

        {/* Bio */}
        <div className="grid gap-1.5">
          <div className="flex items-baseline justify-between">
            <label
              htmlFor="profile-bio"
              className="mono text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ color: "var(--ink-muted)" }}
            >
              {t("bio")}
            </label>
            <span
              className="mono text-[10px] font-bold"
              style={{
                color: bioOverLimit ? "var(--alert)" : "var(--ink-muted)",
                letterSpacing: "0.04em",
              }}
            >
              {bio.length}/{BIO_MAX}
            </span>
          </div>
          <textarea
            id="profile-bio"
            name="bio"
            rows={4}
            maxLength={BIO_MAX + 40}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={t("bioPlaceholder")}
            className="w-full text-[16px] leading-snug border-[1.5px] focus:outline-none"
            style={{
              padding: "12px 14px",
              background: "var(--surface)",
              color: "var(--ink)",
              borderColor: bioError ? "var(--alert)" : "var(--line)",
              borderRadius: "var(--r-card)",
              resize: "vertical",
              minHeight: 96,
              transition: "border-color var(--t-1) var(--ease)",
            }}
            aria-invalid={bioError ? true : undefined}
            aria-describedby={bioError ? "profile-bio-err" : undefined}
          />
          {bioError ? (
            <p
              id="profile-bio-err"
              className="text-[12px]"
              style={{ color: "var(--alert)" }}
            >
              {bioError}
            </p>
          ) : null}
          {!bioError && remaining < 40 ? (
            <p
              className="mono text-[10px]"
              style={{ color: "var(--ink-muted)" }}
            >
              {remaining} characters left
            </p>
          ) : null}
        </div>

        {/* AI suggest row */}
        <div className="grid gap-3">
          <button
            type="button"
            onClick={handleSuggest}
            disabled={aiState === "loading" || !bio.trim()}
            className="btn-s2m"
            style={{
              minHeight: 48,
              fontSize: 14,
              opacity: aiState === "loading" || !bio.trim() ? 0.55 : 1,
              cursor:
                aiState === "loading" || !bio.trim() ? "not-allowed" : "pointer",
              alignSelf: "stretch",
            }}
            aria-live="polite"
          >
            <AIMark size={14} />
            <span>
              {aiState === "loading" ? t("aiThinking") : t("suggestSports")}
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
                {t("aiPicked")}
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

        {formError ? (
          <p
            className="text-[12px]"
            style={{ color: "var(--alert)" }}
            role="alert"
          >
            {formError}
          </p>
        ) : null}
      </div>

      <WizardStickyActionBar
        secondaryLabel={t("back")}
        secondaryHref={`/${locale}`}
        primaryLabel={t("next")}
        onPrimary={handleNext}
        primaryLoading={isPending}
      />
    </div>
  );
}
