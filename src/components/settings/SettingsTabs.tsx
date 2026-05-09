"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";

export type SettingsSectionId =
  | "profile"
  | "sports"
  | "location"
  | "privacy"
  | "reminders"
  | "integrations";

export type SettingsTabsProps = {
  sections: ReadonlyArray<{ id: SettingsSectionId; label: string }>;
  current: SettingsSectionId;
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
export function SettingsTabs({ sections, current }: SettingsTabsProps) {
  const pathname = usePathname() ?? "";
  const searchParamsRaw = useSearchParams();
  const searchParams = useMemo(
    () => new URLSearchParams(searchParamsRaw?.toString() ?? ""),
    [searchParamsRaw],
  );

  return (
    <>
      {/* Mobile: horizontal scroll pill row */}
      <nav
        aria-label="Settings sections"
        className="md:hidden"
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          padding: "10px 16px",
          background: "var(--surface)",
          borderBottom: "1px solid var(--line)",
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

      {/* Desktop: vertical sidebar tabs with --accent underline (left rail) */}
      <nav
        aria-label="Settings sections"
        className="hidden md:flex"
        style={{
          flexDirection: "column",
          gap: 2,
          padding: "16px 0",
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
                padding: "10px 18px 10px 16px",
                minHeight: 40,
                display: "flex",
                alignItems: "center",
                fontSize: 14,
                fontWeight: 600,
                color: active ? "var(--ink)" : "var(--ink-muted)",
                background: active ? "var(--surface-2)" : "transparent",
                borderRadius: "var(--r-chip)",
                textDecoration: "none",
                borderLeft: active
                  ? "3px solid var(--accent)"
                  : "3px solid transparent",
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
