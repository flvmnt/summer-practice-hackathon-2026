"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Glyph } from "@/components/ui/Glyph";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import type { AppLocale } from "@/i18n/routing";

type RevealCopy = {
  eyebrow: string;
  title: string;
  body: string;
  label: string;
  copy: string;
  copied: string;
  download: string;
  downloaded: string;
  savedConfirm: string;
  continue: string;
  privacy: string;
  toastCopiedTitle: string;
  toastCopiedBody: string;
  toastDownloadedTitle: string;
  toastDownloadedBody: string;
};

type Props = {
  recoveryCode: string;
  username: string;
  locale: AppLocale;
  copy: RevealCopy;
};

/**
 * RecoveryCodeReveal — design canvas screen 01.
 *
 * Renders the recovery code as 5 separate mono tiles. Continue button is a
 * hard gate: disabled until the user either copies, downloads, OR ticks the
 * "I saved it" checkbox.
 *
 * Never logs the code.
 */
function splitIntoBlocks(code: string): string[] {
  // Already hyphenated: "RX-7Q-K9-VB-2T" -> ["RX","7Q","K9","VB","2T"]
  if (code.includes("-")) return code.split("-").filter(Boolean);
  // Fallback: chunk into 2s.
  const chunks: string[] = [];
  for (let i = 0; i < code.length; i += 2) {
    chunks.push(code.slice(i, i + 2));
  }
  return chunks;
}

function RecoveryCodeRevealInner({ recoveryCode, username, locale, copy }: Props) {
  const router = useRouter();
  const toast = useToast();
  const blocks = useMemo(() => splitIntoBlocks(recoveryCode), [recoveryCode]);
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const canContinue = copied || downloaded || confirmed;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(recoveryCode);
    } catch {
      // best-effort fallback
      const ta = document.createElement("textarea");
      ta.value = recoveryCode;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* noop */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    toast.push({
      title: copy.toastCopiedTitle,
      description: copy.toastCopiedBody,
      variant: "success",
      durationMs: 2400,
    });
  };

  const onDownload = () => {
    const safe = (username || "account").replace(/[^a-z0-9_-]/gi, "").slice(0, 32) || "account";
    const blob = new Blob([recoveryCode + "\n"], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `s2m-recovery-${safe}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    setDownloaded(true);
    toast.push({
      title: copy.toastDownloadedTitle,
      description: copy.toastDownloadedBody,
      variant: "success",
      durationMs: 2400,
    });
  };

  const onContinue = () => {
    if (!canContinue) return;
    router.push(`/${locale}/onboarding/profile`);
  };

  return (
    <div className="grid gap-5">
      {/* Code tiles in a tactile bordered card */}
      <div
        style={{
          padding: "22px 18px 18px",
          background: "var(--accent-soft)",
          border: "1px dashed color-mix(in oklch, var(--accent) 35%, transparent)",
          borderRadius: "var(--r-surface)",
        }}
      >
        <div
          className="mono text-[10px] font-bold uppercase"
          style={{ color: "var(--accent-deep)", letterSpacing: "0.18em" }}
        >
          {copy.label}
        </div>
        <div
          aria-label={copy.label}
          className="mt-3 flex flex-wrap gap-2"
        >
          {blocks.map((block, i) => (
            <span
              key={`${block}-${i}`}
              className="mono"
              style={{
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: "0.12em",
                color: "var(--ink)",
                background: "var(--surface)",
                padding: "8px 12px",
                borderRadius: "var(--r-chip)",
                border: "1px solid var(--line-2)",
                boxShadow: "inset 0 1px 2px rgba(14,26,31,0.05)",
                minWidth: 56,
                textAlign: "center",
              }}
            >
              {block}
            </span>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onCopy}
            className="btn-s2m btn-secondary"
            style={{ minHeight: 48, fontSize: 14, background: "var(--surface)" }}
          >
            {copied ? <Glyph.check size={16} /> : <Glyph.copy size={16} />}
            {copied ? copy.copied : copy.copy}
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="btn-s2m btn-secondary"
            style={{ minHeight: 48, fontSize: 14, background: "var(--surface)" }}
          >
            {downloaded ? <Glyph.check size={16} /> : null}
            {downloaded ? copy.downloaded : copy.download}
          </button>
        </div>
      </div>

      {/* Privacy notice */}
      <div
        className="flex items-center justify-center gap-2"
        style={{
          padding: "10px 14px",
          background: "var(--surface-2)",
          borderRadius: "var(--r-card)",
          color: "var(--ink-muted)",
        }}
      >
        <Glyph.shield size={14} />
        <p className="text-[12px] text-center" style={{ lineHeight: 1.4 }}>
          {copy.privacy}
        </p>
      </div>

      {/* Saved-it checkbox */}
      <label
        className="flex cursor-pointer items-center gap-2.5 text-[13px]"
        style={{ color: "var(--ink)" }}
      >
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.currentTarget.checked)}
          style={{
            width: 20,
            height: 20,
            accentColor: "var(--accent)",
            cursor: "pointer",
          }}
        />
        <span>{copy.savedConfirm}</span>
      </label>

      <button
        type="button"
        onClick={onContinue}
        className="btn-s2m"
        disabled={!canContinue}
        style={{
          width: "100%",
          opacity: canContinue ? 1 : 0.4,
          cursor: canContinue ? "pointer" : "not-allowed",
        }}
      >
        {copy.continue}
      </button>
    </div>
  );
}

export function RecoveryCodeReveal(props: Props) {
  return (
    <ToastProvider>
      <RecoveryCodeRevealInner {...props} />
    </ToastProvider>
  );
}
