import type { Session, User } from "better-auth/types";
import { describe, expect, it } from "vitest";
import {
  isSameSessionIdentity,
  isSameUserIdentity,
} from "./auth-session-identity";

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    email: "a@test.com",
    name: "Ana",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    emailVerified: true,
    ...overrides,
  };
}

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: "session-1",
    userId: "user-1",
    token: "token",
    expiresAt: new Date("2026-12-01T00:00:00.000Z"),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ipAddress: "",
    userAgent: "",
    ...overrides,
  };
}

describe("isSameUserIdentity", () => {
  it("treats a cloned user with the same identity as equal", () => {
    const user = makeUser();
    const clone = makeUser({
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
    });

    expect(isSameUserIdentity(user, clone)).toBe(true);
  });

  it("detects a different user id", () => {
    expect(isSameUserIdentity(makeUser(), makeUser({ id: "user-2" }))).toBe(
      false,
    );
  });

  it("treats null as a change", () => {
    expect(isSameUserIdentity(makeUser(), null)).toBe(false);
    expect(isSameUserIdentity(null, null)).toBe(true);
  });
});

describe("isSameSessionIdentity", () => {
  it("treats a cloned session with the same id and expiry as equal", () => {
    const session = makeSession();
    expect(
      isSameSessionIdentity(
        session,
        makeSession({ expiresAt: new Date(session.expiresAt) }),
      ),
    ).toBe(true);
  });

  it("detects a new session id", () => {
    expect(
      isSameSessionIdentity(makeSession(), makeSession({ id: "session-2" })),
    ).toBe(false);
  });
});
