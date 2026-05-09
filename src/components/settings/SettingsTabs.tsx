"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";

export type SettingsSectionId =
  | "profile"
  | "sports"
  | "location"
  | "privacy"
  | "integrations";

export type SettingsTabsProps = {
  sections: ReadonlyArray<{ id: SettingsSectionId; label: string }>;
  current: SettingsSectionId;
  /** Localized aria-label for the tablist nav. */
  ariaLabel: string;
};

function buildHref(
  pathname: string,
  searchParams: URLSearchParams,
  next: SettingsSectionId,
) {
  const params = new URLSearchParams(searchParams);
  if (next === "profile") {
    params.delete("section");
  } else {
    params.set("section", next);
  }
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

/**
 * Settings tabs - horizontal pill row on mobile, vertical sidebar on desktop.
 * URL-persisted via `?section=`. Active tab uses var(--accent) underline per
 * Direction B brand.
 */
export function SettingsTabs({ sections, current, ariaLabel }: SettingsTabsProps) {
  const pathname = usePathname() ?? "";
  const searchParamsRaw = useSearchParams();
  const searchParams = useMemo(
    () => new URLSearchParams(searchParamsRaw?.toString() ?? ""),
    [searchParamsRaw],
  );

  return (
    <>
      {/* Single horizontal pill row - works at every breakpoint. */}
      <nav
        aria-label={ariaLabel}
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          padding: "10px 16px",
          background: "transparent",
          position: "sticky",
          top: 0,
          zIndex: 5,
          scrollbarWidth: "none",
        }}
      >
        {sections.map((section) => {
          const active = section.id === current;
          return (
            <Link
              key={section.id}
              href={buildHref(pathname, searchParams, section.id)}
              aria-current={active ? "page" : undefined}
              style={{
                position: "relative",
                padding: "8px 14px",
                minHeight: 36,
                display: "inline-flex",
                alignItems: "center",
                whiteSpace: "nowrap",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 600,
                background: active ? "var(--accent-soft)" : "transparent",
                color: active ? "var(--accent-deep)" : "var(--ink-muted)",
                textDecoration: "none",
                boxShadow: active ? "none" : "inset 0 0 0 1px var(--line)",
              }}
            >
              {section.label}
            </Link>
          );
        })}
      </nav>

    </>
  );
}
