"use client";

import { usePathname } from "next/navigation";
import { Glyph } from "@/components/ui/Glyph";
import { useToast } from "@/components/ui/Toast";

type Props = {
  eventId: string;
  title: string;
  whenAt: string; // ISO timestamp
  durationMin: number;
  venueName?: string | null;
  label: string;
  toastTitle?: string;
};

/**
 * In-screen one-click download for the canonical server-generated .ics file.
 * The route sets Content-Disposition, which is more reliable than a blob
 * download in embedded browsers.
 */
export function IcsExportButton({
  eventId,
  label,
  toastTitle,
}: Props) {
  const toast = useToast();
  const pathname = usePathname();
  const locale = pathname?.match(/^\/(en|ro)(?=\/|$)/)?.[1] ?? "ro";
  const href = `/api/events/${encodeURIComponent(eventId)}/ics?locale=${encodeURIComponent(locale)}`;

  const onClick = () => {
    if (toastTitle) {
      toast.push({ title: toastTitle, variant: "success" });
    }
  };

  return (
    <a
      href={href}
      download
      onClick={onClick}
      className="btn-s2m btn-secondary"
      style={{
        width: "100%",
        padding: "10px 16px",
        minHeight: 44,
        fontSize: 14,
        gap: 8,
        textDecoration: "none",
      }}
    >
      <Glyph.cal size={18} />
      {label}
    </a>
  );
}
