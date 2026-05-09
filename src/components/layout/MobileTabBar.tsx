"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Glyph, type GlyphName } from "@/components/ui/Glyph";
import { cn } from "@/lib/utils";

export type MobileTab = {
  id: string;
  href: string;
  label: string;
  glyph: GlyphName;
  /** If set, mark active when pathname starts with one of these prefixes (in addition to exact match). */
  match?: ReadonlyArray<string>;
};

const DEFAULT_TABS: ReadonlyArray<MobileTab> = [
  { id: "today", href: "/today", label: "Today", glyph: "today" },
  {
    id: "groups",
    href: "/groups",
    label: "Groups",
    glyph: "groups",
    match: ["/groups", "/events"],
  },
  { id: "create", href: "/events/new", label: "Create", glyph: "plus" },
  { id: "map", href: "/map", label: "Map", glyph: "map" },
  { id: "profile", href: "/settings", label: "Profile", glyph: "profile" },
];

type Props = {
  tabs?: ReadonlyArray<MobileTab>;
  className?: string;
};

function isActive(pathname: string, tab: MobileTab): boolean {
  if (pathname === tab.href) return true;
  // Strip locale prefix if present (e.g. "/en/today")
  const stripped = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
  if (stripped === tab.href) return true;
  const prefixes = tab.match ?? [tab.href];
  return prefixes.some((p) => stripped.startsWith(p) && p !== "/");
}

function hrefFor(pathname: string, href: string) {
  const match = pathname.match(/^\/(en|ro)(?=\/|$)/);
  return match ? `/${match[1]}${href}` : href;
}

export function MobileTabBar({ tabs = DEFAULT_TABS, className }: Props) {
  const pathname = usePathname() ?? "/";
  return (
    <nav
      aria-label="Primary"
      className={cn("grid md:hidden", className)}
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        height: 78,
        padding: "8px 14px calc(env(safe-area-inset-bottom) + 14px)",
        gridTemplateColumns: `repeat(${tabs.length}, 1fr)`,
        background: "color-mix(in oklch, var(--surface) 90%, transparent)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid var(--line)",
        zIndex: 40,
      }}
    >
      {tabs.map((tab) => {
        const Icon = Glyph[tab.glyph];
        const active = isActive(pathname, tab);
        return (
          <Link
            key={tab.id}
            href={hrefFor(pathname, tab.href)}
            aria-current={active ? "page" : undefined}
            aria-label={tab.label}
            className={cn(
              "flex flex-col items-center justify-center gap-1",
            )}
            style={{
              minWidth: 44,
              minHeight: 44,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
              color: active ? "var(--ink)" : "var(--ink-muted)",
              cursor: "pointer",
            }}
          >
            <Icon size={22} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
