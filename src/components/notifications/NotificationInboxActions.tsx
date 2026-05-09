"use client";

import { useMemo, useState, useTransition } from "react";
import {
  NotificationInbox,
  type NotificationItem,
  type NotificationKind,
} from "@/components/notifications/NotificationInbox";
import { EmptyState } from "@/components/ui/EmptyState";
import { Glyph } from "@/components/ui/Glyph";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/notification-actions";
import { cn } from "@/lib/utils";

type FilterId = "all" | "unread" | "match" | "vote" | "chat" | "event";

type FilterDef = {
  id: FilterId;
  /** Predicate against an item; "all" returns true. */
  match: (item: NotificationItem) => boolean;
};

const FILTERS: ReadonlyArray<FilterDef> = [
  { id: "all", match: () => true },
  { id: "unread", match: (i) => !i.read },
  { id: "match", match: (i) => i.kind === "match-ready" },
  { id: "vote", match: (i) => i.kind === "vote-closing" },
  {
    id: "event",
    match: (i) => i.kind === "event-confirmed",
  },
  { id: "chat", match: (i) => i.kind === "chat-mention" },
];

type NotificationInboxCopy = {
  markAllRead: string;
  markRead: string;
  open: string;
  unreadCount: string;
  allCaughtUp: string;
  filterAria: string;
  justNow: string;
  filters: Record<FilterId, string>;
  kinds: Record<NotificationKind, string>;
};

type Props = {
  initialItems: ReadonlyArray<NotificationItem>;
  copy: NotificationInboxCopy;
  emptyTitle?: string;
  emptyBody?: string;
  emptyActionLabel?: string;
  emptyActionHref?: string;
  emptyFilteredTitle?: string;
  emptyFilteredBody?: string;
};

/**
 * Client wrapper that adds filter chips, mark-read, and mark-all-read on top
 * of the existing `NotificationInbox` primitive without modifying its API.
 *
 * Uses optimistic UI while persisting read state through server actions.
 */
export function NotificationInboxActions({
  initialItems,
  copy,
  emptyTitle,
  emptyBody,
  emptyActionLabel,
  emptyActionHref,
  emptyFilteredTitle,
  emptyFilteredBody,
}: Props) {
  const [items, setItems] = useState<NotificationItem[]>(() =>
    initialItems.map((item) => ({ ...item })),
  );
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [pending, startTransition] = useTransition();

  const unreadCount = useMemo(
    () => items.filter((item) => !item.read).length,
    [items],
  );

  const counts = useMemo<Record<FilterId, number>>(() => {
    const next: Record<FilterId, number> = {
      all: items.length,
      unread: 0,
      match: 0,
      vote: 0,
      chat: 0,
      event: 0,
    };
    for (const item of items) {
      if (!item.read) next.unread += 1;
      if (item.kind === "match-ready") next.match += 1;
      else if (item.kind === "vote-closing") next.vote += 1;
      else if (item.kind === "event-confirmed") next.event += 1;
      else if (item.kind === "chat-mention") next.chat += 1;
    }
    return next;
  }, [items]);

  const filtered = useMemo(() => {
    const def = FILTERS.find((f) => f.id === activeFilter) ?? FILTERS[0];
    return items.filter(def.match);
  }, [items, activeFilter]);

  function handleMarkRead(id: string) {
    const previous = items;
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
    startTransition(async () => {
      const formData = new FormData();
      formData.set("notificationId", id);
      const result = await markNotificationReadAction(formData);
      if (!result.ok) {
        setItems(previous);
      }
    });
  }

  function handleMarkAllRead() {
    const previous = items;
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
    startTransition(async () => {
      const result = await markAllNotificationsReadAction();
      if (!result.ok) {
        setItems(previous);
      }
    });
  }

  const isInboxEmpty = items.length === 0;
  const isFilterEmpty = !isInboxEmpty && filtered.length === 0;
  const markAllDisabled = unreadCount === 0 || pending;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div
          className="mono"
          style={{
            fontSize: 11,
            color: unreadCount > 0 ? "var(--accent-deep)" : "var(--ink-muted)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
          aria-live="polite"
        >
          {unreadCount > 0
            ? copy.unreadCount.replace("{count}", String(unreadCount))
            : copy.allCaughtUp}
        </div>
        <button
          type="button"
          onClick={handleMarkAllRead}
          disabled={markAllDisabled}
          aria-disabled={markAllDisabled}
          aria-busy={pending}
          className={cn(
            "inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold transition-colors",
          )}
          style={{
            minHeight: 44,
            padding: "0 14px",
            borderRadius: "var(--r-pill)",
            background: markAllDisabled
              ? "transparent"
              : "var(--accent-tint)",
            color: markAllDisabled
              ? "var(--ink-faint)"
              : "var(--accent-deep)",
            border: "1px solid",
            borderColor: markAllDisabled
              ? "var(--line)"
              : "var(--accent-soft)",
            cursor: markAllDisabled ? "not-allowed" : "pointer",
            opacity: markAllDisabled ? 0.7 : 1,
          }}
        >
          <Glyph.check size={14} />
          {copy.markAllRead}
        </button>
      </div>

      <FilterChips
        active={activeFilter}
        counts={counts}
        labels={copy.filters}
        ariaLabel={copy.filterAria}
        onChange={setActiveFilter}
      />

      {isInboxEmpty ? (
        <EmptyState
          glyph={<Glyph.bell size={28} />}
          title={emptyTitle ?? "You're all caught up"}
          body={
            emptyBody ??
            "When a match forms, a vote opens, or an event is confirmed, you'll see it here first."
          }
          action={
            emptyActionLabel && emptyActionHref
              ? { label: emptyActionLabel, href: emptyActionHref }
              : undefined
          }
        />
      ) : isFilterEmpty ? (
        <EmptyState
          glyph={<Glyph.filter size={24} />}
          title={emptyFilteredTitle ?? "Nothing in this filter"}
          body={
            emptyFilteredBody ??
            "Try a different filter to see more updates."
          }
          action={{
            label: copy.filters.all,
            onClick: () => setActiveFilter("all"),
          }}
        />
      ) : (
        <NotificationInbox
          items={filtered}
          onMarkRead={handleMarkRead}
          markReadLabel={copy.markRead}
          openLabel={copy.open}
          justNowLabel={copy.justNow}
          kindLabels={copy.kinds}
        />
      )}
    </div>
  );
}

function FilterChips({
  active,
  counts,
  labels,
  ariaLabel,
  onChange,
}: {
  active: FilterId;
  counts: Record<FilterId, number>;
  labels: Record<FilterId, string>;
  ariaLabel: string;
  onChange: (id: FilterId) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex gap-2 overflow-x-auto"
      style={{
        // Avoid horizontal page jiggle on iOS while letting chips wrap on wider viewports.
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        paddingBottom: 4,
      }}
    >
      {FILTERS.map((filter) => {
        const isActive = filter.id === active;
        const count = counts[filter.id];
        return (
          <button
            key={filter.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(filter.id)}
            className={cn(
              "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-xs font-semibold transition-colors",
            )}
            style={{
              minHeight: 44,
              background: isActive ? "var(--accent-soft)" : "var(--surface)",
              color: isActive ? "var(--accent-deep)" : "var(--ink)",
              border: "1px solid",
              borderColor: isActive ? "var(--accent-deep)" : "var(--line)",
              cursor: "pointer",
            }}
          >
            {labels[filter.id]}
            <span
              className="mono"
              style={{
                fontSize: 10,
                padding: "1px 6px",
                borderRadius: 999,
                background: isActive
                  ? "var(--surface)"
                  : "var(--surface-2)",
                color: isActive ? "var(--accent-deep)" : "var(--ink-muted)",
                minWidth: 18,
                textAlign: "center",
              }}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export type { FilterId, NotificationItem, NotificationKind };
