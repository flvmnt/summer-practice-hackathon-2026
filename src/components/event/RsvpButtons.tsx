"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";

export type RsvpStatus = "going" | "maybe" | "declined";

type Props = {
  initial: RsvpStatus;
  copy: {
    going: string;
    maybe: string;
    no: string;
    saved: string;
  };
};

const ORDER: ReadonlyArray<RsvpStatus> = ["going", "maybe", "declined"];

/**
 * Local-first RSVP toggle. Optimistic UI; a future server action (owned by
 * the events lib agent) can wire into `onChange` without changing the shape.
 *
 * Until then the choice is reflected immediately and confirmed via toast so
 * the demo flow stays believable.
 */
export function RsvpButtons({ initial, copy }: Props) {
  const [value, setValue] = useState<RsvpStatus>(initial);
  const toast = useToast();

  const labels: Record<RsvpStatus, string> = {
    going: copy.going,
    maybe: copy.maybe,
    declined: copy.no,
  };

  return (
    <div
      role="radiogroup"
      aria-label="RSVP"
      className="grid grid-cols-3 gap-2"
    >
      {ORDER.map((status) => {
        const active = status === value;
        return (
          <button
            key={status}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => {
              if (status === value) return;
              setValue(status);
              toast.push({
                title: copy.saved,
                description: labels[status],
                variant: "success",
              });
            }}
            className="text-[13px] font-semibold"
            style={{
              padding: "10px 12px",
              minHeight: 44,
              borderRadius: 999,
              border: 0,
              cursor: "pointer",
              background: active ? "var(--accent)" : "var(--surface-2)",
              color: active ? "var(--on-accent)" : "var(--ink)",
              boxShadow: active
                ? "0 4px 14px -6px color-mix(in oklch, var(--accent) 50%, transparent)"
                : "inset 0 0 0 1px var(--line)",
              transition:
                "background var(--t-1) var(--ease), color var(--t-1) var(--ease), box-shadow var(--t-2) var(--ease), transform var(--t-1) var(--ease)",
            }}
          >
            {labels[status]}
          </button>
        );
      })}
    </div>
  );
}
