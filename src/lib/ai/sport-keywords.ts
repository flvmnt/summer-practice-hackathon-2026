import type { SportKey } from "@/lib/sports";

export const SPORT_KEYWORDS: Record<SportKey, readonly string[]> = {
  football: ["football", "fotbal", "soccer", "futbol"],
  basketball: ["basketball", "baschet", "hoops", "basket"],
  tennis: ["tennis", "tenis"],
  volleyball: ["volleyball", "volei", "volley"],
  badminton: ["badminton", "shuttle"],
  running: [
    "run",
    "runs",
    "runner",
    "running",
    "alerg",
    "alergare",
    "jog",
    "jogging",
    "marathon",
    "maraton",
    "5k",
    "10k",
  ],
  cycling: [
    "cycle",
    "cycles",
    "cycling",
    "ciclism",
    "bike",
    "biking",
    "biciclet",
    "mtb",
  ],
  yoga: ["yoga", "asana", "vinyasa", "ashtanga"],
  hiking: ["hike", "hikes", "hiking", "drumet", "trekking", "munte", "mountain"],
  table_tennis: [
    "table tennis",
    "tenis de masa",
    "ping pong",
    "ping-pong",
    "pingpong",
  ],
};

const COMBINING_MARKS = /[̀-ͯ]/g;

export function normalizeText(text: string): string {
  return ` ${text.toLowerCase().normalize("NFD").replace(COMBINING_MARKS, "")} `;
}

export function findMatchingKeyword(
  paddedNormalizedText: string,
  keywords: readonly string[],
): string | undefined {
  for (const kw of keywords) {
    const needle = kw.toLowerCase().normalize("NFD").replace(COMBINING_MARKS, "");
    if (paddedNormalizedText.includes(` ${needle}`)) {
      return kw;
    }
  }
  return undefined;
}
