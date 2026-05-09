import { describe, expect, it } from "vitest";
import { postGroupMessageInputSchema } from "@/lib/contracts/chat";

describe("chat contracts", () => {
  it("trims and validates group messages", () => {
    expect(
      postGroupMessageInputSchema.parse({
        groupId: "11111111-1111-4111-8111-111111111111",
        body: "  Bringing a ball  ",
        clientId: "client-1",
      }),
    ).toEqual({
      groupId: "11111111-1111-4111-8111-111111111111",
      body: "Bringing a ball",
      clientId: "client-1",
    });
  });

  it("rejects empty group messages", () => {
    expect(() =>
      postGroupMessageInputSchema.parse({
        groupId: "11111111-1111-4111-8111-111111111111",
        body: " ",
        clientId: "client-1",
      }),
    ).toThrow();
  });
});
