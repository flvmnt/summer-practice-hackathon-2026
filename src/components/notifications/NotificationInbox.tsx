"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Glyph } from "@/components/ui/Glyph";
import { cn } from "@/lib/utils";

export type NotificationKind =
  | "match-ready"
  | "vote-closing"
  | "event-confirmed"
  | "chat-mention";

export type NotificationItem = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href: string;
  read: boolean;
  createdAt?: string; // ISO
};

type Props = {
  items: NotificationItem[];
  onMarkRead?: (id: string) => void;
  markReadLabel?: string;
  openLabel?: string;
  justNowLabel?: string;
  kindLabels?: Record<NotificationKind, string>;
  className?: string;
};

const kindMeta: Record<
  NotificationKind,
  { color: string; soft: string; icon: ReactNode; label: string }
> = {
  "match-ready": {
    color: "var(--accent-deep)",
    soft: "var(--accent-soft)",
    icon: <Glyph.spark size={18} />,
    label: "Match",
  },
  "vote-closing": {
    color: "var(--warn-token)",
    soft: "var(--warn-soft)",
    icon: <Glyph.vote size={18} />,
    label: "Vote",
  },
  "event-confirmed": {
    color: "var(--field)",
    soft: "var(--field-soft)",
    icon: <Glyph.cal size={18} />,
    label: "Event",
  },
  "chat-mention": {
    color: "var(--ink-2)",
    soft: "var(--surface-2)",
    icon: <Glyph.chat size={18} />,
    label: "Chat",
  },
};

/**
 * Localized relative time using `Intl.RelativeTimeFormat`. Falls back to a
 * shared "Just now" label inside the last minute and locale-formatted date
 * once we're past a week (to avoid "in 3 weeks" oddities).
 */
function useRelativeTime(iso: string | undefined, justNowLabel: string) {
  const locale = useLocale();
  // Re-compute every minute so labels stay fresh while the user lingers.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  return useMemo(() => {
    if (!iso) return { label: "", absolute: "" };
    const ts = Date.parse(iso);
    if (Number.isNaN(ts)) return { label: "", absolute: "" };

    const diffSeconds = Math.round((ts - now) / 1000);
    const absSeconds = Math.abs(diffSeconds);
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    const dtf = new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    });
    const absolute = dtf.format(new Date(ts));

    let label: string;
    if (absSeconds < 45) {
      label = justNowLabel;
    } else if (absSeconds < 60 * 60) {
      label = rtf.format(Math.round(diffSeconds / 60), "minute");
    } else if (absSeconds < 60 * 60 * 24) {
      label = rtf.format(Math.round(diffSeconds / 3600), "hour");
    } else if (absSeconds < 60 * 60 * 24 * 7) {
      label = rtf.format(Math.round(diffSeconds / 86_400), "day");
    } else {
      label = absolute;
    }

    return { label, absolute };
  }, [iso, now, locale, justNowLabel]);
}

export function NotificationInbox({
  items,
  onMarkRead,
  markReadLabel = "Mark read",
  openLabel = "Open",
  justNowLabel = "Just now",
  kindLabels,
  className,
}: Props) {
  return (
    <ul
      className={cn("flex flex-col gap-2", className)}
      aria-label="Notifications"
    >
      {items.map((item) => (
        <NotificationRow
          key={item.id}
          item={item}
          onMarkRead={onMarkRead}
          markReadLabel={markReadLabel}
          openLabel={openLabel}
          justNowLabel={justNowLabel}
          kindLabels={kindLabels}
        />
      ))}
    </ul>
  );
}

function NotificationRow({
  item,
  onMarkRead,
  markReadLabel,
  openLabel,
  justNowLabel,
  kindLabels,
}: {
  item: NotificationItem;
  onMarkRead?: (id: string) => void;
  markReadLabel: string;
  openLabel: string;
  justNowLabel: string;
  kindLabels?: Record<NotificationKind, string>;
}) {
  const meta = kindMeta[item.kind];
  const kindLabel = kindLabels?.[item.kind] ?? meta.label;
  const time = useRelativeTime(item.createdAt, justNowLabel);

  // Unread differentiation:
  //  - subtle accent-tint background
  //  - thicker left border in accent
  //  - bolder title weight
  //  - dot indicator (top-right)
  const isUnread = !item.read;

  return (
    <li>
      <article
        className={cn("relative")}
        style={{
          background: isUnread ? "var(--accent-tint)" : "var(--surface)",
          border: "1px solid var(--line)",
          borderLeft: isUnread
            ? "3px solid var(--accent)"
            : "1px solid var(--line)",
          borderRadius: "var(--r-card)",
          boxShadow: isUnread ? "var(--shadow-1)" : "none",
          transition: "background 180ms var(--ease)",
        }}
      >
        <Link
          href={item.href}
          aria-label={`${kindLabel}: ${item.title}. ${openLabel}`}
          className="flex items-start gap-3 p-3 sm:p-4"
          style={{
            color: "var(--ink)",
            textDecoration: "none",
            minHeight: 44,
          }}
        >
          <div
            aria-hidden
            className="grid place-items-center"
            style={{
              width: 40,
              height: 40,
              borderRadius: "var(--r-chip)",
              background: meta.soft,
              color: meta.color,
              flex: "none",
            }}
          >
            {meta.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className="mono uppercase tracking-[0.12em]"
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: meta.color,
                }}
              >
                {kindLabel}
              </span>
              {time.label ? (
                <>
                  <span
                    aria-hidden
                    style={{
                      width: 3,
                      height: 3,
                      borderRadius: 999,
                      background: "var(--ink-faint)",
                      flex: "none",
                    }}
                  />
                  <time
                    className="mono"
                    dateTime={item.createdAt}
                    title={time.absolute}
                    style={{
                      fontSize: 11,
                      color: "var(--ink-muted)",
                    }}
                  >
                    {time.label}
                  </time>
                </>
              ) : null}
            </div>
            <h3
              className="mt-1 truncate leading-tight"
              style={{
                fontSize: 15,
                fontWeight: isUnread ? 700 : 500,
                color: "var(--ink)",
              }}
            >
              {item.title}
            </h3>
            {item.body ? (
              <p
                className="mt-1 leading-snug"
                style={{
                  fontSize: 13,
                  color: isUnread ? "var(--ink-2)" : "var(--ink-muted)",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {item.body}
              </p>
            ) : null}
          </div>
          <div
            className="flex flex-col items-end gap-2"
            style={{ flex: "none" }}
          >
            {isUnread ? (
              <span
                aria-hidden
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: "var(--accent)",
                  boxShadow: "0 0 0 2px var(--surface)",
                }}
              />
            ) : null}
          </div>
        </Link>
        {isUnread && onMarkRead ? (
          <div
            className="flex justify-end px-3 pb-3 sm:px-4 sm:pb-3"
            style={{ borderTop: "1px dashed var(--line)" }}
          >
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onMarkRead(item.id);
              }}
              className="inline-flex items-center gap-1"
              style={{
                marginTop: 8,
                fontSize: 12,
                fontWeight: 600,
                color: "var(--ink-muted)",
                background: "transparent",
                border: 0,
                padding: "8px 4px",
                minHeight: 32,
                cursor: "pointer",
              }}
            >
              <Glyph.check size={12} />
              {markReadLabel}
            </button>
          </div>
        ) : null}
      </article>
    </li>
  );
}
