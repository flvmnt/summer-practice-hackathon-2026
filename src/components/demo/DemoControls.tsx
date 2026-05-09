"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Dialog } from "@/components/ui/Dialog";
import { Glyph } from "@/components/ui/Glyph";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import type { AppLocale } from "@/i18n/routing";

type Copy = {
  seed: string;
  seeding: string;
  reset: string;
  resetting: string;
  scriptedFlow: string;
  resetTitle: string;
  resetBody: string;
  resetConfirm: string;
  cancel: string;
  toastSeedOk: string;
  toastSeedFailed: string;
  toastResetOk: string;
  toastResetFailed: string;
  notWired: string;
};

type Props = {
  locale: AppLocale;
  copy: Copy;
};

export function DemoControls({ locale, copy }: Props) {
  return (
    <ToastProvider>
      <DemoControlsInner locale={locale} copy={copy} />
    </ToastProvider>
  );
}

function DemoControlsInner({ locale, copy }: Props) {
  const toast = useToast();
  const [seeding, setSeeding] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const onSeed = useCallback(async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/demo/seed", {
        method: "POST",
        headers: { "content-type": "application/json" },
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        note?: string;
        data?: { users?: number; groups?: number; events?: number };
      };
      if (res.ok && body.ok) {
        const users = body.data?.users ?? 0;
        const groups = body.data?.groups ?? 0;
        toast.push({
          title: copy.toastSeedOk,
          description: `${users} users · ${groups} groups`,
          variant: "success",
        });
      } else {
        toast.push({
          title: copy.toastSeedFailed,
          description: body.note ?? body.error ?? copy.notWired,
          variant: "alert",
        });
      }
    } catch (err) {
      toast.push({
        title: copy.toastSeedFailed,
        description: err instanceof Error ? err.message : "network",
        variant: "alert",
      });
    } finally {
      setSeeding(false);
    }
  }, [copy, toast]);

  const onReset = useCallback(async () => {
    setResetting(true);
    setResetOpen(false);
    try {
      const res = await fetch("/api/demo/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        note?: string;
      };
      if (res.ok && body.ok) {
        toast.push({ title: copy.toastResetOk, variant: "success" });
      } else {
        toast.push({
          title: copy.toastResetFailed,
          description: body.note ?? body.error ?? copy.notWired,
          variant: "alert",
        });
      }
    } catch (err) {
      toast.push({
        title: copy.toastResetFailed,
        description: err instanceof Error ? err.message : "network",
        variant: "alert",
      });
    } finally {
      setResetting(false);
    }
  }, [copy, toast]);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <button
        type="button"
        onClick={onSeed}
        disabled={seeding}
        className="btn-s2m"
        style={{ minHeight: 44, padding: "10px 16px", fontSize: 14, gap: 8 }}
      >
        <Glyph.plus size={18} />
        {seeding ? copy.seeding : copy.seed}
      </button>
      <button
        type="button"
        onClick={() => setResetOpen(true)}
        disabled={resetting}
        className="btn-s2m btn-secondary"
        style={{ minHeight: 44, padding: "10px 16px", fontSize: 14, gap: 8 }}
      >
        <Glyph.close size={18} />
        {resetting ? copy.resetting : copy.reset}
      </button>
      <Link
        href={`/${locale}/today?demo=scripted`}
        className="btn-s2m btn-ghost"
        style={{
          minHeight: 44,
          padding: "10px 16px",
          fontSize: 14,
          gap: 8,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          textDecoration: "none",
        }}
      >
        <Glyph.arrow size={18} />
        {copy.scriptedFlow}
      </Link>

      <Dialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        ariaLabel={copy.resetTitle}
      >
        <h3
          className="text-[16px] font-bold"
          style={{ color: "var(--ink)" }}
        >
          {copy.resetTitle}
        </h3>
        <p
          className="mt-2 text-[13px] leading-snug"
          style={{ color: "var(--ink-muted)" }}
        >
          {copy.resetBody}
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setResetOpen(false)}
            className="btn-s2m btn-secondary"
            style={{ minHeight: 40, padding: "8px 14px", fontSize: 13 }}
          >
            {copy.cancel}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="btn-s2m"
            style={{
              minHeight: 40,
              padding: "8px 14px",
              fontSize: 13,
              background: "var(--alert)",
              color: "white",
            }}
          >
            {copy.resetConfirm}
          </button>
        </div>
      </Dialog>
    </div>
  );
}
