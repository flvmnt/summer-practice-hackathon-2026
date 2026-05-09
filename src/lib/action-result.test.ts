import { describe, expect, it } from "vitest";
import { actionError, actionOk } from "@/lib/action-result";

describe("action result helpers", () => {
  it("creates success results with and without data", () => {
    expect(actionOk()).toEqual({ ok: true });
    expect(actionOk({ id: "123" })).toEqual({ ok: true, data: { id: "123" } });
  });

  it("creates validation errors with field errors", () => {
    expect(actionError("validation", { fieldErrors: { username: "taken" } })).toEqual({
      ok: false,
      error: "validation",
      fieldErrors: { username: "taken" },
    });
  });

  it("creates rate-limit errors with retry metadata", () => {
    expect(actionError("rate_limited", { retryAfterSeconds: 30 })).toEqual({
      ok: false,
      error: "rate_limited",
      retryAfterSeconds: 30,
    });
  });
});
