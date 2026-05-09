"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, type ReactNode } from "react";
import { Tabs } from "@/components/ui/Tabs";

export type EventTabId = "details" | "chat" | "vote";

type Props = {
  copy: { details: string; chat: string; vote: string };
  details: ReactNode;
  chat: ReactNode;
  vote: ReactNode;
  /** Default tab when no `?tab=` is set. */
  defaultTab?: EventTabId;
  className?: string;
};

const TAB_IDS: ReadonlyArray<EventTabId> = ["details", "chat", "vote"];

function isEventTabId(value: string | null): value is EventTabId {
  return value !== null && (TAB_IDS as ReadonlyArray<string>).includes(value);
}

/**
 * URL-persisted tabs (`?tab=details|chat|vote`). Renders the chosen panel
 * client-side; server work is done up-front by the page so changing tabs
 * does not refetch.
 */
export function EventTabs({
  copy,
  details,
  chat,
  vote,
  defaultTab = "details",
  className,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabParam = searchParams?.get("tab") ?? null;
  const value: EventTabId = isEventTabId(tabParam) ? tabParam : defaultTab;

  const items = useMemo(
    () => [
      { id: "details" as const, label: copy.details },
      { id: "chat" as const, label: copy.chat },
      { id: "vote" as const, label: copy.vote },
    ],
    [copy.details, copy.chat, copy.vote],
  );

  const onChange = useCallback(
    (next: EventTabId) => {
      const params = new URLSearchParams(
        searchParams ? Array.from(searchParams.entries()) : [],
      );
      if (next === defaultTab) {
        params.delete("tab");
      } else {
        params.set("tab", next);
      }
      const query = params.toString();
      const href = query ? `${pathname}?${query}` : pathname;
      router.replace(href, { scroll: false });
    },
    [defaultTab, pathname, router, searchParams],
  );

  return (
    <div className={className}>
      <Tabs<EventTabId>
        value={value}
        onChange={onChange}
        items={items}
        ariaLabel="Event sections"
      />
      <div role="tabpanel" aria-label={items.find((i) => i.id === value)?.label}>
        {value === "details" ? details : null}
        {value === "chat" ? chat : null}
        {value === "vote" ? vote : null}
      </div>
    </div>
  );
}
