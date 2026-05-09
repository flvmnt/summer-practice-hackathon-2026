import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  children: ReactNode;
};

/**
 * Layout primitive for a single settings section: title, optional description,
 * and content slot. Uses --surface card with --line border so each section
 * stands as its own block, mirroring the Card vocabulary.
 */
export function SettingsSection({ title, description, children }: Props) {
  return (
    <section
      className="flex flex-col gap-3 p-5"
      style={{
        background: "var(--surface)",
        borderRadius: "var(--r-card)",
        border: "1px solid var(--line)",
        boxShadow: "var(--shadow-1)",
      }}
    >
      <header className="flex flex-col gap-1">
        <h2
          className="display"
          style={{ fontSize: 18, lineHeight: 1.15, color: "var(--ink)" }}
        >
          {title}
        </h2>
        {description ? (
          <p
            className="text-[13px]"
            style={{ color: "var(--ink-muted)", lineHeight: 1.5 }}
          >
            {description}
          </p>
        ) : null}
      </header>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}
