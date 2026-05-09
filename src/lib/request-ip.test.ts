import { describe, expect, it } from "vitest";
import { getRequestIpFromHeaders } from "@/lib/request-ip";

function headers(values: Record<string, string | undefined>) {
  return (name: string) => values[name.toLowerCase()] ?? null;
}

describe("getRequestIpFromHeaders", () => {
  it("prefers trusted direct proxy headers", () => {
    expect(
      getRequestIpFromHeaders(
        headers({
          "cf-connecting-ip": "203.0.113.10",
          "x-forwarded-for": "198.51.100.3",
        }),
      ),
    ).toBe("203.0.113.10");
  });

  it("falls back to the nearest valid forwarded-for hop", () => {
    expect(
      getRequestIpFromHeaders(
        headers({
          "x-forwarded-for": "bad, 198.51.100.3, 203.0.113.10",
        }),
      ),
    ).toBe("203.0.113.10");
  });

  it("returns unknown when no valid IP is present", () => {
    expect(getRequestIpFromHeaders(headers({ "x-forwarded-for": "not-an-ip" }))).toBe(
      "unknown",
    );
  });
});
