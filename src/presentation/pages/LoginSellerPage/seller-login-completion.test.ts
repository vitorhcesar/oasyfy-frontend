import { completeSellerPortalLogin } from "@/presentation/pages/LoginSellerPage/seller-login-completion";
import { consumeSellerLoginError } from "@/presentation/pages/LoginSellerPage/seller-login-error-storage";
import { loadPendingVerification } from "@/presentation/pages/LoginSellerPage/seller-login-verification-storage";
import { setPortalLoginInFlight } from "@/presentation/components/auth/portal-login-lock";
import { beforeEach, describe, expect, it, vi } from "vitest";

const ensureSellerPortalAccess = vi.hoisted(() => vi.fn());
const signOut = vi.hoisted(() => vi.fn());

vi.mock("@/infra/auth", () => ({
  ensureSellerPortalAccess,
  authClient: { signOut },
}));

describe("completeSellerPortalLogin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    setPortalLoginInFlight("seller", false);
  });

  it("shows a persisted error and does not open OTP when the account is admin", async () => {
    ensureSellerPortalAccess.mockResolvedValue({
      kind: "error",
      message: "Esta conta é de administrador. Use o login de admin.",
    });

    const onError = vi.fn();
    const navigate = vi.fn();
    const openSignupVerification = vi.fn();

    await completeSellerPortalLogin({
      email: "admin@test.com",
      navigate,
      openSignupVerification,
      onError,
    });

    expect(onError).toHaveBeenCalledWith(
      "Esta conta é de administrador. Use o login de admin.",
    );
    expect(consumeSellerLoginError()).toBe(
      "Esta conta é de administrador. Use o login de admin.",
    );
    expect(loadPendingVerification()).toBeNull();
    expect(openSignupVerification).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("saves the email then signs out when verification is required", async () => {
    ensureSellerPortalAccess.mockResolvedValue({
      kind: "needs_verification",
    });
    signOut.mockResolvedValue(undefined);

    const openSignupVerification = vi.fn().mockResolvedValue(undefined);

    await completeSellerPortalLogin({
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
