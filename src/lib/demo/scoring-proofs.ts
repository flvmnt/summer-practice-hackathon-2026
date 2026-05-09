import "server-only";

import type {
  ScoringProof,
  ScoringProofStatus,
} from "@/components/demo/ScoringProofRow";

/**
 * Demo-only rubric coverage data. Mirrors `docs/specs/13-scoring-coverage.md`
 * organized by category. Each row has an explicit status:
 *   - live: working in production with real data
 *   - seeded: works only against demo seed data
 *   - fallback: claimed but limited (manual fallback when external is offline)
 *   - pending: not yet wired
 *
 * This file is demo-only and must not be imported by non-demo code.
 */

export type RubricCategoryId =
  | "foundation"
  | "today_matching"
  | "group_chat"
  | "events_voting"
  | "maps_location"
  | "ai"
  | "notifications_calendar"
  | "i18n_sharing"
  | "production_demo";

export type RubricCategory = {
  id: RubricCategoryId;
  label: string;
  rows: ScoringProof[];
};

export const RUBRIC_TOTAL_MAX = 16_600;

export const RUBRIC_CATEGORIES: RubricCategory[] = [
  {
    id: "foundation",
    label: "Foundation: auth + onboarding",
    rows: [
      {
        id: "auth-core",
        label: "Auth: signup + login + recovery",
        points: 600,
        status: "live",
        evidence: "/signup",
        evidenceLabel: "/signup",
        note: "iron-session + bcryptjs + recovery code; full login/recover routes wired.",
      },
      {
        id: "profile-onboarding",
        label: "Profile + bio onboarding",
        points: 600,
        status: "live",
        evidence: "/onboarding/profile",
        evidenceLabel: "/onboarding/profile",
        note: "Full name, bio, public profile fields persisted before sports gate.",
      },
      {
        id: "skill-level",
        label: "Per-sport skill level",
        points: 200,
        status: "live",
        evidence: "/onboarding/sports",
        evidenceLabel: "/onboarding/sports",
        note: "1..5 levels per sport. Drives matching skill-fit explanation.",
      },
      {
        id: "location-onboarding",
        label: "Location + radius onboarding",
        points: 500,
        status: "live",
        evidence: "/onboarding/location",
        evidenceLabel: "/onboarding/location",
        note: "Numeric lat/lng plus maxDistanceKm. Privacy-safe, no exact home pin shown.",
      },
      {
        id: "photo-upload",
        label: "Profile photo upload + processing",
        points: 500,
        status: "live",
        evidence: "/onboarding/photo",
        evidenceLabel: "/onboarding/photo",
        note: "Photo step uploads through uploadProfilePhotoAction: MIME-sniffed, sharp-resized to 512x512 webp, written to R2, with delete-on-replace.",
      },
    ],
  },
  {
    id: "today_matching",
    label: "Today + Matching",
    rows: [
      {
        id: "today-availability",
        label: "ShowUpToday Yes/No prompt",
        points: 500,
        status: "live",
        evidence: "/today",
        evidenceLabel: "/today",
        note: "Five explicit states: prompt, queued, matched, no-prompt, unavailable.",
      },
      {
        id: "smart-matching",
        label: "Smart matching: sport + size + proximity",
        points: 1500,
        status: "seeded",
        evidence: "/today",
        evidenceLabel: "/today",
        note: "Deterministic group formation after Yes against seeded users in Timișoara radius.",
      },
      {
        id: "match-confirmation",
        label: "Match confirmation flow",
        points: 300,
        status: "live",
        evidence: "/groups",
        evidenceLabel: "/groups",
        note: "Invited members see Accept and Decline buttons in the group plan tab that flip group_members.status atomically.",
      },
      {
        id: "compatibility-explanation",
        label: "AI compatibility explanation",
        points: 500,
        status: "live",
        evidence: "/u/demo_alex",
        evidenceLabel: "public profile",
        note: "Public profiles call Groq-backed compatibility scoring when configured; no seeded AI output.",
      },
    ],
  },
  {
    id: "group_chat",
    label: "Group + Chat",
    rows: [
      {
        id: "group-screen",
        label: "Group screen with mobile tabs",
        points: 500,
        status: "live",
        evidence: "/groups",
        evidenceLabel: "/groups",
        note: "Plan / Chat / Players tabs; captain pill; team-balance panel.",
      },
      {
        id: "group-chat",
        label: "Group chat realtime (SSE)",
        points: 500,
        status: "fallback",
        evidence: "/groups",
        evidenceLabel: "open group chat",
        note: "Persisted group chat is live. SSE stream proof is still pending.",
      },
    ],
  },
  {
    id: "events_voting",
    label: "Events + Voting",
    rows: [
      {
        id: "manual-event",
        label: "Manual event creation",
        points: 500,
        status: "live",
        evidence: "/events/new",
        evidenceLabel: "/events/new",
        note: "createManualEventAction auto-creates a group with the caller as captain and inserts the event in one transaction; users without captain groups land here.",
      },
      {
        id: "event-chat",
        label: "Event-scoped chat (separate from group)",
        points: 500,
        status: "live",
        evidence: "/events",
        evidenceLabel: "/events",
        note: "Keyed by eventId; isolated from group chat.",
      },
      {
        id: "captain-assignment",
        label: "Automatic captain assignment",
        points: 500,
        status: "live",
        evidence: "/groups",
        evidenceLabel: "captain pill",
        note: "Deterministic earliest-response captain assignment is persisted on the group.",
      },
      {
        id: "auto-event-setup",
        label: "Auto-event setup + AI Captain Brief",
        points: 1000,
        status: "live",
        evidence: "/events",
        evidenceLabel: "event page",
        note: "Event page calls generateCaptainBrief on demand (cached) with a deterministic fallback when Groq is unconfigured or fails.",
      },
      {
        id: "voting",
        label: "Group voting / polling",
        points: 500,
        status: "live",
        evidence: "/events",
        evidenceLabel: "venue vote",
        note: "Live vote counts; captain manual decision fallback.",
      },
      {
        id: "team-balance",
        label: "Team balancing by skill",
        points: 300,
        status: "live",
        evidence: "/groups",
        evidenceLabel: "team balance",
        note: "Snake-draft balanced teams panel.",
      },
    ],
  },
  {
    id: "maps_location",
    label: "Maps + Location",
    rows: [
      {
        id: "venue-suggestions",
        label: "Venue suggestions with distance + price confidence",
        points: 500,
        status: "seeded",
        evidence: "/map",
        evidenceLabel: "/map",
        note: "Seeded venues + manual entry + sort-by-distance. Price confidence labeled. Overpass live fetch is stretch.",
      },
      {
        id: "maps-fallback",
        label: "MapLibre map + list fallback + directions",
        points: 1000,
        status: "live",
        evidence: "/map",
        evidenceLabel: "/map",
        note: "Lazy MapLibre load; denied-location list fallback; directions links.",
      },
      {
        id: "weather-aware",
        label: "Weather-aware recommendations (Open-Meteo)",
        points: 300,
        status: "fallback",
        evidence: "/events",
        evidenceLabel: "weather card",
        note: "Open-Meteo with rain/wind/cold rules; cached fallback if API stalls.",
      },
    ],
  },
  {
    id: "ai",
    label: "AI / Smart Enhancements",
    rows: [
      {
        id: "ai-bio-extraction",
        label: "AI bio sport extraction",
        points: 500,
        status: "live",
        evidence: "/onboarding/profile",
        evidenceLabel: "/onboarding/profile",
        note: "Calls Groq text extraction on real profile bios when GROQ_API_KEY is configured; no seeded AI output.",
      },
      {
        id: "ai-photo-extraction",
        label: "AI photo sport extraction",
        points: 500,
        status: "live",
        evidence: "/onboarding/photo",
        evidenceLabel: "/onboarding/photo",
        note: "Analyze button calls Groq vision on the uploaded image when configured; offline fallback returns no fake suggestions.",
      },
      {
        id: "ai-compatibility-score",
        label: "AI compatibility scoring (cached)",
        points: 300,
        status: "live",
        evidence: "/u/demo_alex",
        evidenceLabel: "compat score",
        note: "Public profile match score is computed live, cached after the first Groq call, and never pre-seeded.",
      },
      {
        id: "ai-captain-brief",
        label: "AI Captain Brief (action summary)",
        points: 1000,
        status: "live",
        evidence: "/events",
        evidenceLabel: "captain brief",
        note: "Event pages call Groq for the captain brief when configured; deterministic text is only an offline fallback.",
      },
      {
        id: "ai-recommendations",
        label: "Smart teammate recommendations",
        points: 200,
        status: "pending",
        evidence: "/groups",
        evidenceLabel: "invite drawer",
        note: "Ranked candidate suggestions land with invite drawer in Wave 3.",
      },
    ],
  },
  {
    id: "notifications_calendar",
    label: "Notifications + Calendar",
    rows: [
      {
        id: "notifications",
        label: "Persistent notification center",
        points: 300,
        status: "live",
        evidence: "/notifications",
        evidenceLabel: "/notifications",
        note: "Persistent rows + read/unread; header bell entry point.",
      },
      {
        id: "calendar-export",
        label: ".ics calendar export",
        points: 300,
        status: "live",
        evidence: "/events",
        evidenceLabel: "add to calendar",
        note: "Server route + in-screen client export; folded lines.",
      },
    ],
  },
  {
    id: "i18n_sharing",
    label: "i18n + Sharing",
    rows: [
      {
        id: "achievements",
        label: "First Match achievement",
        points: 300,
        status: "live",
        evidence: "/groups",
        evidenceLabel: "First Match badge",
        note: "Only First Match is claimed; Showed Up 3 Times stays unclaimed until real attendance exists.",
      },
      {
        id: "i18n",
        label: "RO/EN multi-language (next-intl)",
        points: 200,
        status: "live",
        evidence: "/en",
        evidenceLabel: "switch RO/EN",
        note: "Locale prefix always; RO default; full message coverage.",
      },
      {
        id: "invite-share",
        label: "Public invite link + share",
        points: 100,
        status: "live",
        evidence: "/events",
        evidenceLabel: "invite link",
        note: "Privacy-safe preview; no chat / attendees / votes exposed.",
      },
    ],
  },
  {
    id: "production_demo",
    label: "Production + Demo",
    rows: [
      {
        id: "deployable-shell",
        label: "Deployable Railway shell + /api/health",
        points: 500,
        status: "live",
        evidence: "/api/health",
        evidenceLabel: "/api/health",
        note: "Railway service; health probes db connectivity.",
      },
      {
        id: "clean-architecture",
        label: "Clean architecture + zod contracts",
        points: 500,
        status: "live",
        evidence: "https://github.com/flvmnt/summer-practice-hackathon-2026",
        evidenceLabel: "repo",
        note: "src/app + src/lib + src/db boundaries; zod-validated server actions.",
      },
      {
        id: "responsive-mobile",
        label: "Responsive mobile-first UI",
        points: 500,
        status: "live",
        evidence: "/today",
        evidenceLabel: "/today",
        note: "360px-first; bottom nav; sticky composers; Playwright screenshots across widths.",
      },
      {
        id: "judge-mode",
        label: "Judge Mode proof page (this screen)",
        points: 200,
        status: "live",
        evidence: "/demo",
        evidenceLabel: "/demo",
        note: "Guarded route, live/seeded/fallback per row, no false-green claims.",
      },
    ],
  },
];

export type RubricSummary = {
  totalClaimed: number;
  totalMax: number;
  byStatus: Record<ScoringProofStatus, { count: number; points: number }>;
};

export function summarizeRubric(
  categories: ReadonlyArray<RubricCategory> = RUBRIC_CATEGORIES,
): RubricSummary {
  const byStatus: RubricSummary["byStatus"] = {
    live: { count: 0, points: 0 },
    seeded: { count: 0, points: 0 },
    fallback: { count: 0, points: 0 },
    pending: { count: 0, points: 0 },
  };
  let totalClaimed = 0;
  for (const category of categories) {
    for (const row of category.rows) {
      const points = row.points ?? 0;
      byStatus[row.status].count += 1;
      byStatus[row.status].points += points;
      if (row.status === "live" || row.status === "seeded") {
        totalClaimed += points;
      }
    }
  }
  return {
    totalClaimed,
    totalMax: RUBRIC_TOTAL_MAX,
    byStatus,
  };
}
