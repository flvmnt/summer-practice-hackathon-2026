import { describe, expect, it } from "vitest";
import { buildTeamBalance } from "@/lib/team-balance";

describe("buildTeamBalance", () => {
  it("snake-drafts ranked players into two deterministic teams", () => {
    const balance = buildTeamBalance([
      { userId: "u1", fullName: "Ada", role: "player", skillLevel: 5 },
      { userId: "u2", fullName: "Bogdan", role: "player", skillLevel: 4 },
      { userId: "u3", fullName: "Carmen", role: "player", skillLevel: 3 },
      { userId: "u4", fullName: "Dan", role: "captain", skillLevel: 2 },
      { userId: "u5", fullName: "Elena", role: "player", skillLevel: 1 },
    ]);

    expect(balance?.teams[0].members.map((member) => member.fullName)).toEqual([
      "Ada",
      "Dan",
      "Elena",
    ]);
    expect(balance?.teams[1].members.map((member) => member.fullName)).toEqual([
      "Bogdan",
      "Carmen",
    ]);
    expect(balance?.teams[0].averageSkill).toBeCloseTo(2.67, 2);
    expect(balance?.teams[1].averageSkill).toBeCloseTo(3.5, 2);
    expect(balance?.score).toBe(79);
  });

  it("uses stable id tie-breakers for equal skill levels", () => {
    const balance = buildTeamBalance([
      { userId: "u3", fullName: "Mihai", role: "player", skillLevel: 3 },
      { userId: "u2", fullName: "Ana", role: "player", skillLevel: 3 },
      { userId: "u1", fullName: "Ana", role: "captain", skillLevel: 3 },
      { userId: "u4", fullName: "Zoe", role: "player", skillLevel: 3 },
    ]);

    expect(balance?.teams[0].members.map((member) => member.userId)).toEqual([
      "u1",
      "u4",
    ]);
    expect(balance?.teams[1].members.map((member) => member.userId)).toEqual([
      "u2",
      "u3",
    ]);
    expect(balance?.score).toBe(100);
  });

  it("is invariant to input order", () => {
    const members = [
      { userId: "u1", fullName: "Ada", role: "player", skillLevel: 5 },
      { userId: "u2", fullName: "Bogdan", role: "player", skillLevel: 4 },
      { userId: "u3", fullName: "Carmen", role: "player", skillLevel: 3 },
      { userId: "u4", fullName: "Dan", role: "captain", skillLevel: 2 },
    ];

    expect(buildTeamBalance(members)?.teams).toEqual(
      buildTeamBalance([...members].reverse())?.teams,
    );
  });

  it("normalizes invalid and out-of-range skill levels", () => {
    const balance = buildTeamBalance([
      { userId: "u1", fullName: "Ada", role: "player", skillLevel: 99 },
      { userId: "u2", fullName: "Bogdan", role: "player", skillLevel: 0 },
      { userId: "u3", fullName: "Carmen", role: "player", skillLevel: Number.NaN },
      { userId: "u4", fullName: "Dan", role: "captain", skillLevel: 2 },
    ]);

    expect(
      balance?.teams.flatMap((team) => team.members).map((member) => member.skillLevel),
    ).toEqual([5, 1, 3, 2]);
  });

  it("supports a deterministic captain reshuffle variant", () => {
    const members = [
      { userId: "u1", fullName: "Ada", role: "player", skillLevel: 5 },
      { userId: "u2", fullName: "Bogdan", role: "player", skillLevel: 4 },
      { userId: "u3", fullName: "Carmen", role: "player", skillLevel: 3 },
      { userId: "u4", fullName: "Dan", role: "captain", skillLevel: 2 },
    ];

    expect(
      buildTeamBalance(members, "b_first")?.teams[0].members.map(
        (member) => member.fullName,
      ),
    ).toEqual(["Bogdan", "Carmen"]);
  });

  it("returns null until there are enough players for two teams", () => {
    expect(
      buildTeamBalance([
        { userId: "u1", fullName: "Solo", role: "captain", skillLevel: 5 },
      ]),
    ).toBeNull();
  });
});
