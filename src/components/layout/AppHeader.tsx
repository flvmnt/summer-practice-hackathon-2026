import Link from "next/link";
import { Glyph } from "@/components/ui/Glyph";
import { HeaderBell } from "@/components/layout/HeaderBell";

type Props = {
  locale: string;
  unreadCount?: number;
  /** Optional title shown next to the logo (e.g., page name). */
  title?: string;
};

/**
 * Slim top app bar (56px) with logo on the left and the notifications
 * `HeaderBell` on the right. Drop into any authed page that doesn't already
 * render its own bespoke header.
 *
 * Usage:
 *   <AppHeader locale={locale} unreadCount={count} />
 */
export function AppHeader({ locale, unreadCount = 0, title }: Props) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "0 16px",
        background: "color-mix(in oklch, var(--surface) 92%, transparent)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <Link
        href={`/${locale}/today`}
        className="inline-flex items-center gap-2"
        style={{ color: "var(--ink)", textDecoration: "none" }}
      >
        <span
          aria-hidden
          className="grid place-items-center"
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "var(--accent-soft)",
            color: "var(--accent-deep)",
          }}
        >
          <Glyph.spark size={16} />
        </span>
        <span
          className="display"
          style={{
            fontSize: 16,
            letterSpacing: "-0.01em",
          }}
        >
          {title ?? "ShowUp2Move"}
        </span>
      </Link>
      <HeaderBell unreadCount={unreadCount} locale={locale} />
    </header>
  );
}
