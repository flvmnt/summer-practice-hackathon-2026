import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Action = {
  label: string;
  onClick?: () => void;
  href?: string;
};

type Props = {
  title: string;
  body?: string;
  glyph?: ReactNode;
  action?: Action;
  className?: string;
};

export function EmptyState({ title, body, glyph, action, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-10 text-center",
        className,
      )}
    >
      {glyph ? (
        <div
          className="mb-4 grid place-items-center"
          style={{
            width: 64,
            height: 64,
            borderRadius: 999,
            background: "var(--surface)",
            color: "var(--ink-muted)",
            boxShadow: "var(--shadow-2)",
          }}
        >
          {glyph}
        </div>
      ) : null}
      <h3
        className="display"
        style={{ fontSize: 24, lineHeight: 1.1, color: "var(--ink)" }}
      >
        {title}
      </h3>
      {body ? (
        <p
          className="mt-2 max-w-[320px]"
          style={{ fontSize: 14, color: "var(--ink-muted)", lineHeight: 1.5 }}
        >
          {body}
        </p>
      ) : null}
      {action ? (
        <div className="mt-5">
          {action.href ? (
            <Link
              href={action.href}
              className="btn-s2m"
              style={{ minHeight: 44, padding: "12px 18px", fontSize: 14 }}
            >
              {action.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              className="btn-s2m"
              style={{ minHeight: 44, padding: "12px 18px", fontSize: 14 }}
            >
              {action.label}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
