"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Glyph, type GlyphName } from "@/components/ui/Glyph";
import { cn } from "@/lib/utils";

type NavItem = {
  id: "today" | "groups" | "create" | "map" | "profile";
  href: string;
  glyph: GlyphName;
  match?: ReadonlyArray<string>;
};

const ITEMS: ReadonlyArray<NavItem> = [
  { id: "today", href: "/today", glyph: "today" },
  {
    id: "groups",
    href: "/groups",
    glyph: "groups",
    match: ["/groups", "/events"],
  },
  { id: "create", href: "/events/new", glyph: "plus" },
  { id: "map", href: "/map", glyph: "map" },
  { id: "profile", href: "/settings", glyph: "profile" },
];

function stripLocale(pathname: string): string {
  return pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
}

function isActive(pathname: string, item: NavItem): boolean {
  const stripped = stripLocale(pathname);
  if (stripped === item.href) return true;
  const prefixes = item.match ?? [item.href];
  return prefixes.some((p) => stripped.startsWith(p) && p !== "/");
}

function hrefFor(pathname: string, href: string) {
  const match = pathname.match(/^\/(en|ro)(?=\/|$)/);
  return match ? `/${match[1]}${href}` : href;
}

type Props = {
  unreadCount?: number;
  className?: string;
};

/**
 * Desktop-only left sidebar nav. 240px wide, hidden below md. Mirrors the
 * MobileTabBar items so users have one consistent navigation model across
 * breakpoints. Pages that mount this should also push their content right
 * with the `has-desktop-sidebar` helper class on their root element.
 */
export function DesktopSidebar({ unreadCount = 0, className }: Props) {
  const pathname = usePathname() ?? "/";
  const t = useTranslations("sidebar");
  const hasUnread = unreadCount > 0;
  const localeMatch = pathname.match(/^\/(en|ro)(?=\/|$)/);
  const localePrefix = localeMatch ? `/${localeMatch[1]}` : "";
  const notificationsHref = `${localePrefix}/notifications`;
  const notificationsActive = stripLocale(pathname).startsWith("/notifications");

  return (
    <aside
      aria-label={t("ariaLabel")}
      className={cn("hidden md:flex md:flex-col", className)}
      style={{
        position: "fixed",
        top: 0,
        bottom: 0,
        left: 0,
        width: 240,
        zIndex: 30,
        background: "var(--surface)",
        borderRight: "1px solid var(--line)",
        padding: "20px 14px 18px",
        gap: 18,
      }}
    >
      {/* Brand block */}
      <Link
        href={hrefFor(pathname, "/today")}
        className="inline-flex items-center gap-2"
        style={{ color: "var(--ink)", textDecoration: "none", padding: "0 6px" }}
      >
        <span
          aria-hidden
          className="grid place-items-center"
          style={{
            width: 32,
            height: 32,
            borderRadius: "var(--r-chip)",
            background: "var(--accent-soft)",
            color: "var(--accent-deep)",
            flex: "none",
          }}
        >
          <Glyph.spark size={18} />
        </span>
        <span
          className="display"
          style={{
            fontSize: 17,
            letterSpacing: "-0.01em",
            lineHeight: 1.1,
          }}
        >
          ShowUp2Move
        </span>
      </Link>

      {/* Primary nav */}
      <nav aria-label={t("primaryAriaLabel")} className="flex flex-col gap-1">
        {ITEMS.map((item) => {
          const Icon = Glyph[item.glyph];
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.id}
              href={hrefFor(pathname, item.href)}
              aria-current={active ? "page" : undefined}
              className="flex items-center gap-3"
              style={{
                minHeight: 44,
                padding: "0 12px",
                borderRadius: "var(--r-chip)",
                background: active ? "var(--accent-tint)" : "transparent",
                color: active ? "var(--accent-deep)" : "var(--ink)",
                fontSize: 14,
                fontWeight: active ? 600 : 500,
                letterSpacing: "-0.005em",
                textDecoration: "none",
                transition: "background-color 120ms ease",
              }}
            >
              <Icon size={20} />
              <span>{t(`items.${item.id}`)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Spacer pushes the notifications row to the bottom */}
      <div style={{ flex: 1 }} />

      {/* Notifications row */}
      <Link
        href={notificationsHref}
        aria-current={notificationsActive ? "page" : undefined}
        aria-label={
          hasUnread
            ? t("notificationsWithCount", { count: unreadCount })
            : t("notifications")
        }
        className="flex items-center gap-3"
        style={{
          minHeight: 44,
          padding: "0 12px",
          borderRadius: "var(--r-chip)",
          background: notificationsActive ? "var(--accent-tint)" : "transparent",
          color: notificationsActive ? "var(--accent-deep)" : "var(--ink)",
          fontSize: 14,
          fontWeight: notificationsActive ? 600 : 500,
          textDecoration: "none",
          position: "relative",
        }}
      >
        <span style={{ position: "relative", display: "inline-flex" }}>
          <Glyph.bell size={20} />
          {hasUnread ? (
            <span
              aria-hidden
              style={{
                position: "absolute",
                top: -2,
                right: -3,
                width: 9,
                height: 9,
                borderRadius: 999,
                background: "var(--accent)",
                boxShadow: "0 0 0 1.5px var(--surface)",
              }}
            />
          ) : null}
        </span>
        <span>{t("notifications")}</span>
        {hasUnread ? (
          <span
            aria-hidden
            className="mono"
            style={{
              marginLeft: "auto",
              fontSize: 11,
              color: "var(--ink-muted)",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </Link>
    </aside>
  );
}
