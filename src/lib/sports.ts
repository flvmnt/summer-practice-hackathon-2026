export const SPORT_KEYS = [
  "football",
  "basketball",
  "tennis",
  "volleyball",
  "badminton",
  "running",
  "cycling",
  "yoga",
  "hiking",
  "table_tennis",
] as const;

export type SportKey = (typeof SPORT_KEYS)[number];

export const SPORTS: Record<
  SportKey,
  {
    sizeMin: number;
    sizeIdeal: number;
    sizeMax: number;
    evenTeams: boolean;
    outdoor: boolean;
    indoor: boolean;
    kind: "pitch" | "court" | "route" | "studio" | "trail" | "table";
  }
> = {
  football: {
    sizeMin: 6,
    sizeIdeal: 12,
    sizeMax: 14,
    evenTeams: true,
    outdoor: true,
    indoor: false,
    kind: "pitch",
  },
  basketball: {
    sizeMin: 4,
    sizeIdeal: 8,
    sizeMax: 10,
    evenTeams: true,
    outdoor: true,
    indoor: true,
    kind: "court",
  },
  tennis: {
    sizeMin: 2,
    sizeIdeal: 4,
    sizeMax: 4,
    evenTeams: true,
    outdoor: true,
    indoor: true,
    kind: "court",
  },
  volleyball: {
    sizeMin: 6,
    sizeIdeal: 12,
    sizeMax: 14,
    evenTeams: true,
    outdoor: true,
    indoor: true,
    kind: "court",
  },
  badminton: {
    sizeMin: 2,
    sizeIdeal: 4,
    sizeMax: 4,
    evenTeams: true,
    outdoor: false,
    indoor: true,
    kind: "court",
  },
  running: {
    sizeMin: 1,
    sizeIdeal: 4,
    sizeMax: 8,
    evenTeams: false,
    outdoor: true,
    indoor: false,
    kind: "route",
  },
  cycling: {
    sizeMin: 1,
    sizeIdeal: 4,
    sizeMax: 8,
    evenTeams: false,
    outdoor: true,
    indoor: false,
    kind: "route",
  },
  yoga: {
    sizeMin: 2,
    sizeIdeal: 6,
    sizeMax: 12,
    evenTeams: false,
    outdoor: true,
    indoor: true,
    kind: "studio",
  },
  hiking: {
    sizeMin: 2,
    sizeIdeal: 6,
    sizeMax: 12,
    evenTeams: false,
    outdoor: true,
    indoor: false,
    kind: "trail",
  },
  table_tennis: {
    sizeMin: 2,
    sizeIdeal: 4,
    sizeMax: 4,
    evenTeams: true,
    outdoor: false,
    indoor: true,
    kind: "table",
  },
};

export const SKILL_LEVELS = [1, 2, 3, 4, 5] as const;
export const DISTANCE_OPTIONS_KM = [1, 3, 5, 10] as const;
