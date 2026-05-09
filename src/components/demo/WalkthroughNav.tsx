"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";
import { Glyph } from "@/components/ui/Glyph";
import type { AppLocale } from "@/i18n/routing";
import {
  WALKTHROUGH_STEPS,
  resolveStepIndex,
} from "@/lib/demo/walkthrough";

type Props = {
  locale: AppLocale;
};

/**
 * Mid-right floating PowerPoint-style navigation for the scripted demo.
 * Visible only when the s2m_walkthrough cookie is set (server side decides);
 * the layout gates the mount.
 */
export function WalkthroughNav({ locale }: Props) {
  const pathname = usePathname();
  const t = useTranslations("walkthrough");

  const { currentIndex, prevHref, nextHref } = useMemo(() => {
    const idx = resolveStepIndex(pathname ?? "");
    const prev = idx > 0 ? WALKTHROUGH_STEPS[idx - 1].href(locale) : null;
    const next =
      idx >= 0 && idx < WALKTHROUGH_STEPS.length - 1
        ? WALKTHROUGH_STEPS[idx + 1].href(locale)
        : null;
    return { currentIndex: idx, prevHref: prev, nextHref: next };
  }, [pathname, locale]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.target instanceof HTMLElement) {
        const tag = event.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || event.target.isContentEditable) {
          return;
        }
      }
      if (event.key === "ArrowRight" && nextHref) {
        window.location.assign(nextHref);
      } else if (event.key === "ArrowLeft" && prevHref) {
        window.location.assign(prevHref);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prevHref, nextHref]);

  if (currentIndex < 0) return null;

  const total = WALKTHROUGH_STEPS.length;
  const stepNumber = currentIndex + 1;
  const currentLabel = t(`steps.${WALKTHROUGH_STEPS[currentIndex].labelKey}`);
  const prevLabel = prevHref
    ? t(`steps.${WALKTHROUGH_STEPS[currentIndex - 1].labelKey}`)
    : "";
  const nextLabel = nextHref
    ? t(`steps.${WALKTHROUGH_STEPS[currentIndex + 1].labelKey}`)
    : "";

  return (
    <div
      aria-label={t("nav.aria")}
      className="pointer-events-none fixed inset-y-0 right-0 z-40 flex items-center pr-3"
    >
      <div className="pointer-events-auto flex flex-col items-center gap-2">
        <NavButton
          href={prevHref}
          ariaLabel={t("nav.previous", { label: prevLabel })}
          disabled={!prevHref}
        >
          <Glyph.back size={20} />
        </NavButton>
        <div
          className="mono select-none rounded-full px-2 py-1 text-[11px] font-semibold tracking-wider"
          style={{
            background: "var(--surface)",
            color: "var(--ink-muted)",
            border: "1px solid var(--line)",
            boxShadow: "0 4px 14px rgba(14,26,31,0.14)",
            minWidth: 44,
            textAlign: "center",
          }}
          title={currentLabel}
        >
          {stepNumber}/{total}
        </div>
        <NavButton
          href={nextHref}
          ariaLabel={t("nav.next", { label: nextLabel })}
          disabled={!nextHref}
        >
          <Glyph.arrow size={20} />
        </NavButton>
      </div>
    </div>
  );
}

function NavButton({
  href,
  ariaLabel,
  disabled,
  children,
}: {
  href: string | null;
  ariaLabel: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  const baseStyle: React.CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: 999,
    background: disabled ? "var(--surface-2)" : "var(--surface)",
    color: disabled ? "var(--ink-muted)" : "var(--ink)",
    border: "1px solid var(--line)",
    boxShadow: "0 6px 18px rgba(14,26,31,0.18)",
    display: "grid",
    placeItems: "center",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
    transition: "transform 120ms ease, background 120ms ease",
  };

  if (disabled || !href) {
    return (
      <span
        aria-disabled="true"
        aria-label={ariaLabel}
        role="button"
        style={baseStyle}
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      style={baseStyle}
      className="hover:[transform:scale(1.06)]"
    >
      {children}
    </Link>
  );
}
