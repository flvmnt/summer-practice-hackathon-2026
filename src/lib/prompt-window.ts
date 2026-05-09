import type { PromptSlot } from "@/lib/contracts/prompt";

const ROMANIA_TIME_ZONE = "Europe/Bucharest";

function romaniaParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: ROMANIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "";

  return {
    date: `${part("year")}-${part("month")}-${part("day")}`,
    hour: Number(part("hour")),
  };
}

export function activePromptWindow(now = new Date()): {
  windowDate: string;
  windowSlot: PromptSlot;
} {
  const { date, hour } = romaniaParts(now);

  if (hour < 12) {
    return { windowDate: date, windowSlot: "morning" };
  }

  if (hour < 17) {
    return { windowDate: date, windowSlot: "afternoon" };
  }

  return { windowDate: date, windowSlot: "evening" };
}
