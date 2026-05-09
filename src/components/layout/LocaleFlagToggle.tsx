"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Glyph } from "@/components/ui/Glyph";
import type { AppLocale } from "@/i18n/routing";

type Props = {
  locale: AppLocale;
  /** Path within the current locale to preserve when switching, e.g. "/settings". */
  pathWithinLocale?: string;
  size?: number;
};

const LOCALES: ReadonlyArray<{
  code: AppLocale;
  flag: string;
  label: string;
}> = [
  { code: "ro", flag: "RO", label: "Romana" },
  { code: "en", flag: "EN", label: "English" },
];

/**
 * Globe-icon language switcher with a dropdown listing both locales. Clicking
 * the trigger opens a small popover; each option is a real <Link> so the
 * route resolves with the current path preserved under the chosen locale.
 *
 * Component name is kept as LocaleFlagToggle for callsite compatibility.
 */
export function LocaleFlagToggle({
  locale,
  pathWithinLocale = "",
  size = 36,
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const buttonId = useId();
  const menuId = useId();

  const trimmed = pathWithinLocale.startsWith("/")
    ? pathWithinLocale
    : pathWithinLocale
      ? `/${pathWithinLocale}`
      : "";

  const hrefFor = (target: AppLocale) =>
    `/${target}${trimmed}`.replace(/\/+$/, "") || `/${target}`;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <button
        id={buttonId}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={locale === "ro" ? "Schimba limba" : "Change language"}
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          height: size,
          padding: "0 8px",
          background: "transparent",
          border: 0,
          color: "var(--ink-muted)",
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "0.02em",
        }}
      >
        <Glyph.globe size={Math.round(size * 0.5)} />
        <span aria-hidden="true">{locale.toUpperCase()}</span>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-labelledby={buttonId}
          style={{
            position: "absolute",
            right: 0,
            top: `calc(100% + 6px)`,
            minWidth: 160,
            maxWidth: "min(240px, calc(100vw - 16px))",
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "var(--r-card)",
            boxShadow: "var(--shadow-3)",
            padding: 4,
            zIndex: 50,
          }}
        >
          {LOCALES.map((option) => {
            const isActive = option.code === locale;
            return (
              <Link
                key={option.code}
                role="menuitemradio"
                aria-checked={isActive}
                href={hrefFor(option.code)}
                hrefLang={option.code}
                onClick={() => setOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: "calc(var(--r-card) - 4px)",
                  fontSize: 14,
                  color: "var(--ink)",
                  background: isActive ? "var(--surface-2)" : "transparent",
                  textDecoration: "none",
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                <span>{option.label}</span>
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: "var(--ink-muted)",
                    letterSpacing: "0.06em",
                  }}
                  aria-hidden="true"
                >
                  {option.flag}
                </span>
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
