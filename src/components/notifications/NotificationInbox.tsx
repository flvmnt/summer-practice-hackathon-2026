"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Glyph } from "@/components/ui/Glyph";
import { EmptyState } from "@/components/ui/EmptyState";
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
  className?: string;
  emptyTitle?: string;
  emptyBody?: string;
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

export function NotificationInbox({
  items,
  onMarkRead,
  className,
  emptyTitle = "No notifications",
  emptyBody = "We'll ping you when a group forms, vote closes, or an event is confirmed.",
}: Props) {
  if (items.length === 0) {
    return (
      <EmptyState
        glyph={<Glyph.bell size={28} />}
        title={emptyTitle}
        body={emptyBody}
        className={className}
      />
    );
  }
  return (
    <ul className={cn("flex flex-col gap-2", className)} aria-label="Notifications">
      {items.map((item) => {
        const meta = kindMeta[item.kind];
        return (
          <li key={item.id}>
            <article
              className={cn(
                "relative flex items-start gap-3 p-3",
                !item.read && "outline-2",
              )}
              style={{
                background: item.read ? "var(--surface)" : "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: "var(--r-card)",
                boxShadow: item.read ? "none" : "var(--shadow-1)",
              }}
            >
              {!item.read ? (
                <span
                  aria-hidden
                  className="absolute top-3 right-3"
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: "var(--accent)",
                  }}
                />
              ) : null}
              <div
                className="grid place-items-center"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
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
                    className="mono text-[10px] font-bold uppercase tracking-[0.12em]"
                    style={{ color: meta.color }}
                  >
                    {meta.label}
                  </span>
                </div>
                <h3
                  className="mt-1 truncate text-[14px] font-semibold leading-tight"
                  style={{ color: "var(--ink)" }}
                >
                  {item.title}
                </h3>
                <p
                  className="mt-1 text-[12px] leading-snug"
                  style={{ color: "var(--ink-muted)" }}
                >
                  {item.body}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-1 text-[12px] font-semibold"
                    style={{ color: "var(--accent-deep)" }}
                  >
                    Open
                    <Glyph.arrow size={14} />
                  </Link>
                  {!item.read && onMarkRead ? (
                    <button
                      type="button"
                      onClick={() => onMarkRead(item.id)}
                      className="text-[12px] font-medium"
                      style={{
                        color: "var(--ink-muted)",
                        background: "transparent",
                        border: 0,
                        padding: 0,
                        minHeight: 32,
                        cursor: "pointer",
                      }}
                    >
                      Mark read
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
