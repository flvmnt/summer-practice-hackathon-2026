import type { CSSProperties } from "react";
import { Avatar } from "@/components/ui/Avatar";

type Props = {
  count?: number;
  label?: string;
  className?: string;
};

const SAMPLE_NAMES: ReadonlyArray<string> = [
  "Alex Marin",
  "Diana Vlad",
  "Radu Pop",
  "Ioana Lupu",
  "Sergiu C",
];

/**
 * Social proof row — overlapping avatars + count.
 * Placeholder names until real data wires in (A2/A3 backfill).
 */
export function NearbyAvatarRow({
  count = 8,
  label = "nearby playing today",
  className,
}: Props) {
  const ringStyle: CSSProperties = {
    border: "2px solid var(--bg)",
    borderRadius: 999,
    flex: "none",
  };
  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div style={{ display: "flex" }}>
        {SAMPLE_NAMES.map((name, i) => (
          <span
            key={name}
            style={{
              ...ringStyle,
              marginLeft: i === 0 ? 0 : -10,
            }}
          >
            <Avatar name={name} size={28} />
          </span>
        ))}
      </div>
      <div
        style={{
          fontSize: 13,
          color: "var(--ink-muted)",
          lineHeight: 1.3,
        }}
      >
        <strong style={{ color: "var(--ink)" }}>{count} nearby</strong> {label}
      </div>
    </div>
  );
}
