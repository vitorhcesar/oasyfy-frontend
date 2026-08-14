import { completePortalLogin } from "@/presentation/pages/LoginSellerPage/seller-login-completion";
import { consumeSellerLoginError } from "@/presentation/pages/LoginSellerPage/seller-login-error-storage";
import { loadPendingVerification } from "@/presentation/pages/LoginSellerPage/seller-login-verification-storage";
import { setLoginInFlight } from "@/presentation/components/auth/portal-login-lock";
import { beforeEach, describe, expect, it, vi } from "vitest";

const resolvePortalLogin = vi.hoisted(() => vi.fn());
const signOut = vi.hoisted(() => vi.fn());

vi.mock("@/infra/auth", () => ({
  resolvePortalLogin,
  authClient: { signOut },
}));

describe("completePortalLogin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    setLoginInFlight(false);
  });

  it("redirects an admin to /admin", async () => {
    resolvePortalLogin.mockResolvedValue({ kind: "admin" });

    const navigate = vi.fn();

    await completePortalLogin({
      email: "admin@test.com",
      navigate,
      openSignupVerification: vi.fn(),
      onError: vi.fn(),
    });

    expect(navigate).toHaveBeenCalledWith("/admin");
    expect(loadPendingVerification()).toBeNull();
  });

  it("redirects a seller to /seller", async () => {
    resolvePortalLogin.mockResolvedValue({ kind: "seller" });

    const navigate = vi.fn();

    await completePortalLogin({
      email: "seller@test.com",
      navigate,
      openSignupVerification: vi.fn(),
      onError: vi.fn(),
    });

    expect(navigate).toHaveBeenCalledWith("/seller");
  });

  it("shows a persisted error when access is denied", async () => {
    resolvePortalLogin.mockResolvedValue({
      kind: "error",
      message: "Esta conta não possui permissão de acesso.",
    });

    const onError = vi.fn();
    const navigate = vi.fn();
    const openSignupVerification = vi.fn();

    await completePortalLogin({
      email: "nobody@test.com",
      navigate,
      openSignupVerification,
      onError,
    });

    expect(onError).toHaveBeenCalledWith(
      "Esta conta não possui permissão de acesso.",
    );
    expect(consumeSellerLoginError()).toBe(
      "Esta conta não possui permissão de acesso.",
    );
    expect(loadPendingVerification()).toBeNull();
    expect(openSignupVerification).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("saves the email then signs out when verification is required", async () => {
    resolvePortalLogin.mockResolvedValue({
      kind: "needs_verification",
    });
    signOut.mockResolvedValue(undefined);

    const openSignupVerification = vi.fn().mockResolvedValue(undefined);

    await completePortalLogin({
      email: "seller@test.com",
      navigate: vi.fn(),
      openSignupVerification,
      onError: vi.fn(),
    });

    expect(loadPendingVerification()).toEqual({ email: "seller@test.com" });
    expect(signOut).toHaveBeenCalledOnce();
    expect(openSignupVerification).toHaveBeenCalledOnce();
  });
});
