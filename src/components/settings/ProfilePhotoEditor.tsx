"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Glyph } from "@/components/ui/Glyph";
import { uploadProfilePhotoAction } from "@/lib/upload-actions";

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp";

type Copy = {
  changeLabel: string;
  uploadingLabel: string;
  errorGeneric: string;
  errorTooLarge: string;
};

type Props = {
  fullName: string;
  initialPhotoUrl: string | null;
  copy: Copy;
};

/**
 * Compact avatar + change-photo control for the settings Profile section.
 * Reuses uploadProfilePhotoAction (same server action the onboarding wizard
 * uses), so validation, R2 write, and rate limiting are already covered.
 *
 * On a successful upload we router.refresh() so the freshly persisted URL
 * shows up across the app on the next render without any cache surgery.
 */
export function ProfilePhotoEditor({
  fullName,
  initialPhotoUrl,
  copy,
}: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pending, startTransition] = useTransition();
  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl);
  const [error, setError] = useState<string | null>(null);

  function pickFile() {
    setError(null);
    inputRef.current?.click();
  }

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.set("photo", file);

    startTransition(async () => {
      const result = await uploadProfilePhotoAction(formData);
      if (!result.ok) {
        setError(
          result.error === "too_large" ? copy.errorTooLarge : copy.errorGeneric,
        );
        return;
      }
      setPhotoUrl(result.data.photoUrl);
      router.refresh();
    });
    event.target.value = "";
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar src={photoUrl} name={fullName} size={64} />
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={pickFile}
          disabled={pending}
          className="btn-s2m btn-secondary"
          aria-busy={pending}
          style={{
            minHeight: 36,
            padding: "6px 12px",
            fontSize: 13,
            gap: 6,
            display: "inline-flex",
            alignItems: "center",
            cursor: pending ? "wait" : "pointer",
          }}
        >
          <Glyph.camera size={14} />
          {pending ? copy.uploadingLabel : copy.changeLabel}
        </button>
        {error ? (
          <p
            role="alert"
            className="mono text-[11px]"
            style={{ color: "var(--negative)" }}
          >
            {error}
          </p>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        onChange={onChange}
        style={{ display: "none" }}
      />
    </div>
  );
}
