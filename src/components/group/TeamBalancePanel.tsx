"use client";

import { Scale } from "lucide-react";
import { useMemo, useState } from "react";
import {
  buildTeamBalance,
  type TeamBalanceMember,
  type TeamBalanceVariant,
} from "@/lib/team-balance";

type TeamBalanceCopy = {
  title: string;
  score: string;
  team: string;
  member: string;
  shuffle: string;
};

type Props = {
  members: TeamBalanceMember[];
  canShuffle: boolean;
  copy: TeamBalanceCopy;
};

function formatTemplate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export function TeamBalancePanel({ members, canShuffle, copy }: Props) {
  const [variant, setVariant] = useState<TeamBalanceVariant>("a_first");
  const teamBalance = useMemo(
    () => buildTeamBalance(members, variant),
    [members, variant],
  );

  if (!teamBalance) {
    return null;
  }

  return (
    <div className="mt-5 rounded-md border border-[var(--line)] bg-white p-3">
      <div className="mb-3 flex items-center gap-2">
        <Scale aria-hidden="true" size={18} />
        <h2 className="text-sm font-bold">{copy.title}</h2>
      </div>
      <p className="mb-3 rounded-md bg-[var(--surface-2)] px-3 py-2 text-sm font-semibold">
        {formatTemplate(copy.score, { score: teamBalance.score })}
      </p>
      <div className="grid gap-3">
        {teamBalance.teams.map((team) => (
          <article
            className="rounded-md border border-[var(--line)] bg-[var(--surface-2)] p-3"
            key={team.label}
          >
            <p className="text-sm font-bold">
              {formatTemplate(copy.team, {
                team: team.label,
                average: team.averageSkill.toFixed(1),
              })}
            </p>
            <ul className="mt-2 grid gap-1 text-sm leading-6 text-[var(--muted)]">
              {team.members.map((member) => (
                <li key={member.userId}>
                  {formatTemplate(copy.member, {
                    name: member.fullName,
                    level: member.skillLevel,
                  })}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      {canShuffle ? (
        <button
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-md border border-[var(--line)] bg-white px-3 text-sm font-semibold"
          type="button"
          onClick={() =>
            setVariant((current) => (current === "a_first" ? "b_first" : "a_first"))
          }
        >
          {copy.shuffle}
        </button>
      ) : null}
    </div>
  );
}
