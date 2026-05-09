"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Glyph } from "@/components/ui/Glyph";
import { cn } from "@/lib/utils";

type Props = {
  unreadCount: number;
  /** Optional locale prefix; if omitted, navigates to `/notifications`. */
  locale?: string;
  className?: string;
};

/**
 * Header bell - small client component that lives in every authed top bar.
 *
 * Renders an icon button with `Glyph.bell`. When `unreadCount > 0`, an accent
 * dot sits in the upper-right corner with an `--ink` ring (per spec
 * `docs/specs/06-ui-flows.md` §10.0). Tapping navigates to `/notifications`.
 */
export function HeaderBell({ unreadCount, locale, className }: Props) {
  const router = useRouter();
  const t = useTranslations("notifications.bell");
  const hasUnread = unreadCount > 0;
  const label = hasUnread
    ? t("labelUnread", { count: unreadCount })
    : t("label");
  const href = locale ? `/${locale}/notifications` : "/notifications";

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => router.push(href)}
      className={cn(
        "relative inline-flex items-center justify-center rounded-full transition-colors focus-visible:outline-3 focus-visible:outline-offset-2",
        className,
      )}
      style={{
        width: 40,
        height: 40,
        background: "var(--surface)",
        boxShadow: "inset 0 0 0 1px var(--line)",
        color: "var(--ink)",
        cursor: "pointer",
      }}
    >
      <Glyph.bell size={18} />
      {hasUnread ? (
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            width: 10,
            height: 10,
            borderRadius: 999,
            background: "var(--accent)",
            boxShadow: "0 0 0 1.5px var(--ink)",
          }}
        />
      ) : null}
      <span className="sr-only">{label}</span>
    </button>
  );
}
