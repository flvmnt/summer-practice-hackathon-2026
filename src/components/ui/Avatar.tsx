import { cn } from "@/lib/utils";

type Props = {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
  alt?: string;
};

function initialsFor(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function Avatar({ src, name, size = 40, className, alt }: Props) {
  const dim = size;
  const fontSize = Math.max(11, Math.round(size * 0.36));
  const initials = initialsFor(name);
  return (
    <span
      className={cn("inline-flex items-center justify-center overflow-hidden", className)}
      style={{
        width: dim,
        height: dim,
        borderRadius: 999,
        background: "var(--accent-soft)",
        color: "var(--accent-deep)",
        fontWeight: 700,
        fontSize,
        flex: "none",
      }}
      aria-label={alt ?? name}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt ?? name}
          width={dim}
          height={dim}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </span>
  );
}
