"use client";

import { useMemo, useState } from "react";
import {
  NotificationInbox,
  type NotificationItem,
  type NotificationKind,
} from "@/components/notifications/NotificationInbox";
import { EmptyState } from "@/components/ui/EmptyState";
import { Glyph } from "@/components/ui/Glyph";
import { cn } from "@/lib/utils";

type FilterId = "all" | "unread" | "match" | "vote" | "chat" | "event";

type FilterDef = {
  id: FilterId;
  label: string;
  /** Predicate against an item; "all" returns true. */
  match: (item: NotificationItem) => boolean;
};

const FILTERS: ReadonlyArray<FilterDef> = [
  { id: "all", label: "All", match: () => true },
  { id: "unread", label: "Unread", match: (i) => !i.read },
  { id: "match", label: "Match", match: (i) => i.kind === "match-ready" },
  { id: "vote", label: "Vote", match: (i) => i.kind === "vote-closing" },
  {
    id: "event",
    label: "Event",
    match: (i) => i.kind === "event-confirmed",
  },
  { id: "chat", label: "Chat", match: (i) => i.kind === "chat-mention" },
];

type Props = {
  initialItems: ReadonlyArray<NotificationItem>;
  emptyTitle?: string;
  emptyBody?: string;
};

/**
 * Client wrapper that adds filter chips, mark-read, and mark-all-read on top
 * of the existing `NotificationInbox` primitive without modifying its API.
 *
 * State is local to this component for the demo. A future server action can
 * persist read state — see TODOs.
 */
export function NotificationInboxActions({
  initialItems,
  emptyTitle,
  emptyBody,
}: Props) {
  const [items, setItems] = useState<NotificationItem[]>(() =>
    initialItems.map((item) => ({ ...item })),
  );
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");

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
    // TODO: persist read state via server action once notifications schema lands.
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  }

  function handleMarkAllRead() {
    // TODO: persist via server action once notifications schema lands.
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div
          className="mono"
          style={{
            fontSize: 11,
            color: "var(--ink-muted)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          {unreadCount > 0
            ? `${unreadCount} unread`
            : "All caught up"}
        </div>
        <button
          type="button"
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0}
          className="inline-flex items-center gap-1.5 rounded-md px-3 text-sm font-semibold transition-colors disabled:opacity-40"
          style={{
            minHeight: 36,
            background: "transparent",
            color: "var(--ink)",
            border: "1px solid var(--line)",
            cursor: unreadCount === 0 ? "default" : "pointer",
          }}
        >
          <Glyph.check size={14} />
          Mark all read
        </button>
      </div>

      <FilterChips
        active={activeFilter}
        counts={counts}
        onChange={setActiveFilter}
      />

      {filtered.length === 0 ? (
        <EmptyState
          glyph={<Glyph.bell size={28} />}
          title={emptyTitle ?? "You're caught up"}
          body={
            emptyBody ??
            "New matches, votes, and event updates will appear here."
          }
        />
      ) : (
        <NotificationInbox items={filtered} onMarkRead={handleMarkRead} />
      )}
    </div>
  );
}

function FilterChips({
  active,
  counts,
  onChange,
}: {
  active: FilterId;
  counts: Record<FilterId, number>;
  onChange: (id: FilterId) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Filter notifications"
      className="flex gap-2 overflow-x-auto"
      style={{
        // Avoid horizontal page jiggle on iOS while letting chips wrap on wider viewports.
        scrollbarWidth: "none",
        msOverflowStyle: "none",
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
              minHeight: 32,
              background: isActive
                ? "var(--accent-soft)"
                : "var(--surface)",
              color: isActive ? "var(--accent-deep)" : "var(--ink)",
              border: "1px solid",
              borderColor: isActive ? "var(--accent-deep)" : "var(--line)",
              cursor: "pointer",
            }}
          >
            {filter.label}
            <span
              className="mono"
              style={{
                fontSize: 10,
                color: isActive ? "var(--accent-deep)" : "var(--ink-muted)",
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
