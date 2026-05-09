import { SPORTS, type SportKey } from "@/lib/sports";

export type MatchCandidate = {
  userId: string;
  demoRunId: string | null;
  sportPrefs: SportKey[];
  city: string | null;
  lat: number;
  lng: number;
  maxDistanceKm: number;
  skillLevel: number;
  respondedAt: Date;
};

export type FormedGroupDraft = {
  sport: SportKey;
  captainUserId: string;
  city: string | null;
  centerLat: number;
  centerLng: number;
  sizeTarget: number;
  members: Array<{
    userId: string;
    demoRunId: string | null;
    role: "captain" | "player";
  }>;
};

const EARTH_RADIUS_KM = 6371;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

function compatibleByDistance(seed: MatchCandidate, candidate: MatchCandidate) {
  const maxDistanceKm = Math.min(seed.maxDistanceKm, candidate.maxDistanceKm);
  return haversineKm(seed, candidate) <= maxDistanceKm;
}

function groupCenter(candidates: MatchCandidate[]) {
  return {
    lat: candidates.reduce((total, candidate) => total + candidate.lat, 0) / candidates.length,
    lng: candidates.reduce((total, candidate) => total + candidate.lng, 0) / candidates.length,
  };
}

function captainFor(candidates: MatchCandidate[]) {
  return [...candidates].sort((a, b) => a.respondedAt.getTime() - b.respondedAt.getTime())[0];
}

function rankForSeed(seed: MatchCandidate, candidates: MatchCandidate[]) {
  return [...candidates].sort((a, b) => {
    if (a.userId === seed.userId) {
      return -1;
    }

    if (b.userId === seed.userId) {
      return 1;
    }

    const distanceDelta = haversineKm(seed, a) - haversineKm(seed, b);
    if (distanceDelta !== 0) {
      return distanceDelta;
    }

    return a.respondedAt.getTime() - b.respondedAt.getTime();
  });
}

function removeMembers(candidates: MatchCandidate[], members: MatchCandidate[]) {
  const memberIds = new Set(members.map((member) => member.userId));
  return candidates.filter((candidate) => !memberIds.has(candidate.userId));
}

export function formDeterministicGroups(candidates: MatchCandidate[]): FormedGroupDraft[] {
  const drafts: FormedGroupDraft[] = [];
  const sportsByCount = [...SPORTS_ORDER].sort(
    (a, b) =>
      candidates.filter((candidate) => candidate.sportPrefs.includes(b)).length -
      candidates.filter((candidate) => candidate.sportPrefs.includes(a)).length,
  );
  const assignedUsers = new Set<string>();

  for (const sport of sportsByCount) {
    const config = SPORTS[sport];
    let sportCandidates = candidates
      .filter((candidate) => !assignedUsers.has(candidate.userId))
      .filter((candidate) => candidate.sportPrefs.includes(sport))
      .sort((a, b) => a.respondedAt.getTime() - b.respondedAt.getTime());

    while (sportCandidates.length >= config.sizeMin) {
      const seed = sportCandidates[0];
      const compatible = rankForSeed(seed, sportCandidates)
        .filter((candidate) => compatibleByDistance(seed, candidate))
        .slice(0, config.sizeIdeal);

      if (compatible.length < config.sizeMin) {
        sportCandidates = sportCandidates.slice(1);
        continue;
      }

      const captain = captainFor(compatible);
      const center = groupCenter(compatible);
      drafts.push({
        sport,
        captainUserId: captain.userId,
        city: seed.city,
        centerLat: center.lat,
        centerLng: center.lng,
        sizeTarget: config.sizeIdeal,
        members: compatible.map((candidate) => ({
          userId: candidate.userId,
          demoRunId: candidate.demoRunId,
          role: candidate.userId === captain.userId ? "captain" : "player",
        })),
      });

      for (const member of compatible) {
        assignedUsers.add(member.userId);
      }

      sportCandidates = removeMembers(sportCandidates, compatible);
    }
  }

  return drafts;
}

const SPORTS_ORDER = Object.keys(SPORTS) as SportKey[];
