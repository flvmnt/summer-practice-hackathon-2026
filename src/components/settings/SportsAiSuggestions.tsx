"use client";

import { useState, useTransition } from "react";
import { Glyph } from "@/components/ui/Glyph";
import { extractSportsForCurrentUserAction } from "@/lib/ai-actions";
import { extractSportsFromPhotoAction } from "@/lib/photo-actions";
import type { SportKey } from "@/lib/sports";

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp";

type Suggestion = { sport: SportKey; confidence: number };

type Copy = {
  bioButton: string;
  photoButton: string;
  loadingLabel: string;
  noBio: string;
  noResults: string;
  errorGeneric: string;
  errorTooLarge: string;
  rateLimited: string;
  sportLabels: Record<SportKey, string>;
};

type Props = {
  copy: Copy;
  selected: ReadonlyArray<SportKey>;
  onAdd: (sport: SportKey) => void;
};

/**
 * Two AI affordances inside the Sports editor:
 *  - "Suggest from bio" runs extractSportsForCurrentUserAction (uses the saved
 *    bio - no input file needed).
 *  - "Suggest from photo" pops a hidden file picker and runs
 *    extractSportsFromPhotoAction(formData) on the chosen image.
 *
 * Returned sports render as small + chips. Tapping one calls onAdd() so the
 * parent SportsEditor toggles it into the draft selection.
 */
export function SportsAiSuggestions({ copy, selected, onAdd }: Props) {
  const [pending, startTransition] = useTransition();
  const [pendingKind, setPendingKind] = useState<"bio" | "photo" | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const photoInputId = "sports-ai-photo-input";

  function handleResult(result: {
    ok: boolean;
    suggestions?: ReadonlyArray<{ sport: string; confidence: number }>;
    error?: string;
  }) {
    if (!result.ok) {
      setIsError(true);
      const msg =
        result.error === "too_large"
          ? copy.errorTooLarge
          : result.error === "rate_limited"
            ? copy.rateLimited
            : copy.errorGeneric;
      setStatusText(msg);
      setSuggestions([]);
      return;
    }
    const out = (result.suggestions ?? []).map((s) => ({
      sport: s.sport as SportKey,
      confidence: s.confidence,
    }));
    setSuggestions(out);
    setIsError(false);
    setStatusText(out.length === 0 ? copy.noResults : null);
  }

  function runBio() {
    setPendingKind("bio");
    startTransition(async () => {
      const result = await extractSportsForCurrentUserAction();
      handleResult(result);
      setPendingKind(null);
    });
  }

  function onPhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPendingKind("photo");
    const formData = new FormData();
    formData.set("photo", file);
    startTransition(async () => {
      const result = await extractSportsFromPhotoAction(formData);
      handleResult(result);
      setPendingKind(null);
    });
    event.target.value = "";
  }

  const visibleSuggestions = suggestions.filter(
    (s) => !selected.includes(s.sport),
  );

  return (
    <div
      className="flex flex-col gap-2 rounded-md p-3"
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--line)",
      }}
    >
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={runBio}
          disabled={pending}
          aria-busy={pendingKind === "bio"}
          className="btn-s2m btn-secondary"
          style={{
            minHeight: 36,
            padding: "6px 12px",
            fontSize: 12,
            gap: 6,
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          <Glyph.spark size={14} />
          {pendingKind === "bio" ? copy.loadingLabel : copy.bioButton}
        </button>
        <label
          htmlFor={photoInputId}
          className="btn-s2m btn-secondary"
          aria-busy={pendingKind === "photo"}
          style={{
            minHeight: 36,
            padding: "6px 12px",
            fontSize: 12,
            gap: 6,
            display: "inline-flex",
            alignItems: "center",
            cursor: pending ? "wait" : "pointer",
            opacity: pending ? 0.7 : 1,
          }}
        >
          <Glyph.camera size={14} />
          {pendingKind === "photo" ? copy.loadingLabel : copy.photoButton}
        </label>
        <input
          id={photoInputId}
          type="file"
          accept={ACCEPTED_TYPES}
          onChange={onPhotoChange}
          disabled={pending}
          style={{ display: "none" }}
        />
      </div>

      {visibleSuggestions.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {visibleSuggestions.map((s) => (
            <button
              key={s.sport}
              type="button"
              onClick={() => onAdd(s.sport)}
              className="mono"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 10px",
                borderRadius: 999,
                background: "var(--surface)",
                border: "1px dashed var(--accent)",
                color: "var(--accent-deep)",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Glyph.plus size={12} />
              {copy.sportLabels[s.sport] ?? s.sport}
            </button>
          ))}
        </div>
      ) : null}

      {statusText ? (
        <p
          role={isError ? "alert" : "status"}
          className="text-[11px]"
          style={{
            color: isError ? "var(--negative)" : "var(--ink-muted)",
            lineHeight: 1.4,
          }}
        >
          {statusText}
        </p>
      ) : null}
    </div>
  );
}
