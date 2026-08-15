import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolvePortalLogin } from "./resolve-portal-login";

const getSession = vi.hoisted(() => vi.fn());
const signOut = vi.hoisted(() => vi.fn());
const fetchSessionContext = vi.hoisted(() => vi.fn());

vi.mock("./auth-client", () => ({
  authClient: { getSession, signOut },
}));

vi.mock("./session-context-api", () => ({
  fetchSessionContext,
}));

describe("resolvePortalLogin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({
      data: { user: { emailVerified: true } },
    });
  });

  it("returns admin without signing out", async () => {
    fetchSessionContext.mockResolvedValue({
      role: "admin",
      isBanned: false,
      emailManuallyApproved: false,
      apiAccessEnabled: true,
      pracaAccessEnabled: false,
    });

    await expect(resolvePortalLogin()).resolves.toEqual({ kind: "admin" });
    expect(signOut).not.toHaveBeenCalled();
  });

  it("returns seller when the account is verified", async () => {
    fetchSessionContext.mockResolvedValue({
      role: "seller",
      isBanned: false,
      emailManuallyApproved: false,
      apiAccessEnabled: false,
      pracaAccessEnabled: false,
    });

    await expect(resolvePortalLogin()).resolves.toEqual({ kind: "seller" });
    expect(signOut).not.toHaveBeenCalled();
  });

  it("asks for verification when seller e-mail is not confirmed", async () => {
    getSession.mockResolvedValue({
      data: { user: { emailVerified: false } },
    });
    fetchSessionContext.mockResolvedValue({
      role: "seller",
      isBanned: false,
      emailManuallyApproved: false,
      apiAccessEnabled: false,
      pracaAccessEnabled: false,
    });

    await expect(resolvePortalLogin()).resolves.toEqual({
      kind: "needs_verification",
    });
  });

  it("signs out when the role is unknown", async () => {
    fetchSessionContext.mockResolvedValue({
      role: null,
      isBanned: false,
      emailManuallyApproved: false,
      apiAccessEnabled: false,
      pracaAccessEnabled: false,
    });
    signOut.mockResolvedValue(undefined);

    await expect(resolvePortalLogin()).resolves.toEqual({
      kind: "error",
      message: "Esta conta não possui permissão de acesso.",
    });
    expect(signOut).toHaveBeenCalledOnce();
  });
});
