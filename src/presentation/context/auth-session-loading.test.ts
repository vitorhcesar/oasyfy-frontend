import { describe, expect, it } from "vitest";
import { isAuthSessionLoading } from "./auth-session-loading";

describe("isAuthSessionLoading", () => {
  it("stays loading while the session query is pending", () => {
    expect(isAuthSessionLoading(true, null, null)).toBe(true);
    expect(isAuthSessionLoading(true, "user-1", "user-1")).toBe(true);
  });

  it("stays loading when a user exists but the role was not resolved yet", () => {
    expect(isAuthSessionLoading(false, "user-1", null)).toBe(true);
  });

  it("stays loading when the resolved role belongs to a previous user", () => {
    expect(isAuthSessionLoading(false, "user-2", "user-1")).toBe(true);
  });

  it("is ready when there is no user after the session resolved", () => {
    expect(isAuthSessionLoading(false, null, null)).toBe(false);
  });

  it("is ready when the role was resolved for the current user", () => {
    expect(isAuthSessionLoading(false, "user-1", "user-1")).toBe(false);
  });
});
