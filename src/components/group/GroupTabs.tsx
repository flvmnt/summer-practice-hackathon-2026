"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, type ReactNode } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { cn } from "@/lib/utils";

export type GroupTabId = "plan" | "chat" | "players";

type Props = {
  current: GroupTabId;
  labels: Record<GroupTabId, string>;
  ariaLabel: string;
  plan: ReactNode;
  chat: ReactNode;
  players: ReactNode;
  className?: string;
};

/**
 * Mobile-only tab switcher for the group screen.
 *
 * Persists the active tab in the URL (`?tab=plan|chat|players`) so the
 * mobile back gesture and refresh both keep state. Hidden at md+ where
 * we render all three columns side-by-side instead.
 */
export function GroupTabs({
  current,
  labels,
  ariaLabel,
  plan,
  chat,
  players,
  className,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const items = useMemo(
    () => [
      { id: "plan" as const, label: labels.plan },
      { id: "chat" as const, label: labels.chat },
      { id: "players" as const, label: labels.players },
    ],
    [labels.plan, labels.chat, labels.players],
  );

  const handleChange = useCallback(
    (next: GroupTabId) => {
      if (next === current) return;
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      if (next === "plan") {
        params.delete("tab");
      } else {
        params.set("tab", next);
      }
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [current, pathname, router, searchParams],
  );

  return (
    <div className={cn("md:hidden", className)}>
      <div
        className="px-4"
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--line)",
          position: "sticky",
          top: 0,
          zIndex: 5,
        }}
      >
        <Tabs<GroupTabId>
          ariaLabel={ariaLabel}
          value={current}
          onChange={handleChange}
          items={items}
        />
      </div>
      <div role="tabpanel" hidden={current !== "plan"}>
        {current === "plan" ? plan : null}
      </div>
      <div role="tabpanel" hidden={current !== "chat"}>
        {current === "chat" ? chat : null}
      </div>
      <div role="tabpanel" hidden={current !== "players"}>
        {current === "players" ? players : null}
      </div>
    </div>
  );
}
