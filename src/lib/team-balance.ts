export type TeamBalanceMember = {
  userId: string;
  fullName: string;
  role: string;
  skillLevel: number;
};

export type BalancedTeam = {
  label: "A" | "B";
  averageSkill: number;
  members: TeamBalanceMember[];
};

export type TeamBalance = {
  teams: [BalancedTeam, BalancedTeam];
  score: number;
};

export type TeamBalanceVariant = "a_first" | "b_first";

function averageSkill(members: TeamBalanceMember[]) {
  if (members.length === 0) {
    return 0;
  }

  return (
    members.reduce((total, member) => total + member.skillLevel, 0) / members.length
  );
}

function scoreFor(a: number, b: number) {
  const gap = Math.abs(a - b);
  return Math.max(0, Math.round(100 - gap * 25));
}

function normalizedSkillLevel(value: number) {
  if (!Number.isFinite(value)) {
    return 3;
  }

  return Math.min(5, Math.max(1, Math.round(value)));
}

export function buildTeamBalance(
  members: TeamBalanceMember[],
  variant: TeamBalanceVariant = "a_first",
): TeamBalance | null {
  if (members.length < 2) {
    return null;
  }

  const rankedMembers = members
    .map((member) => ({
      ...member,
      skillLevel: normalizedSkillLevel(member.skillLevel),
    }))
    .sort((left, right) => {
      const skillDelta = right.skillLevel - left.skillLevel;
      if (skillDelta !== 0) {
        return skillDelta;
      }

      return left.userId.localeCompare(right.userId);
    });

  const teamA: TeamBalanceMember[] = [];
  const teamB: TeamBalanceMember[] = [];

  for (const [index, member] of rankedMembers.entries()) {
    const draftSlot = index % 4;
    const goesToStartingTeam = draftSlot === 0 || draftSlot === 3;
    if (
      (variant === "a_first" && goesToStartingTeam) ||
      (variant === "b_first" && !goesToStartingTeam)
    ) {
      teamA.push(member);
    } else {
      teamB.push(member);
    }
  }

  const averageA = averageSkill(teamA);
  const averageB = averageSkill(teamB);

  return {
    teams: [
      {
        label: "A",
        averageSkill: averageA,
        members: teamA,
      },
      {
        label: "B",
        averageSkill: averageB,
        members: teamB,
      },
    ],
    score: scoreFor(averageA, averageB),
  };
}
