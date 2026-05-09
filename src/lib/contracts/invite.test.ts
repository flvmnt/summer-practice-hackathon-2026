import { describe, expect, it } from "vitest";
import {
  eventInviteInputSchema,
  eventInviteTokenSchema,
} from "@/lib/contracts/invite";

describe("eventInviteInputSchema", () => {
  it("accepts event ids with supported locales", () => {
    expect(
      eventInviteInputSchema.parse({
        eventId: "123e4567-e89b-12d3-a456-426614174000",
        locale: "en",
      }),
    ).toEqual({
      eventId: "123e4567-e89b-12d3-a456-426614174000",
      locale: "en",
    });
  });

  it("defaults invite links to Romanian", () => {
    expect(
      eventInviteInputSchema.parse({
        eventId: "123e4567-e89b-12d3-a456-426614174000",
      }).locale,
    ).toBe("ro");
  });
});

describe("eventInviteTokenSchema", () => {
  it("accepts opaque invite tokens without dot separators", () => {
    expect(() =>
      eventInviteTokenSchema.parse(
        "123e4567-e89b-12d3-a456-426614174000_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      ),
    ).not.toThrow();
  });

  it("rejects tokens that look like paths or file names", () => {
    expect(() =>
      eventInviteTokenSchema.parse(
        "123e4567-e89b-12d3-a456-426614174000.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      ),
    ).toThrow();
    expect(() => eventInviteTokenSchema.parse("../events/123")).toThrow();
  });
});
