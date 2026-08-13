import { authClient, ensureSellerPortalAccess } from "@/infra/auth";
import { setPortalLoginInFlight } from "@/presentation/components/auth/portal-login-lock";
import type { NavigateFunction } from "react-router-dom";
import { saveSellerLoginError } from "./seller-login-error-storage";
import { clearPendingTwoFactor } from "./seller-login-two-factor-storage";
import {
  clearPendingVerification,
  savePendingVerification,
} from "./seller-login-verification-storage";

export async function completeSellerPortalLogin(options: {
  email: string;
  navigate: NavigateFunction;
  openSignupVerification: () => Promise<void>;
  onError: (message: string) => void;
}): Promise<void> {
  const gate = await ensureSellerPortalAccess();

  if (gate.kind === "error") {
    clearPendingVerification();
    clearPendingTwoFactor();
    saveSellerLoginError(gate.message);
    options.onError(gate.message);
    return;
  }

  if (gate.kind === "needs_verification") {
    savePendingVerification(options.email);
    clearPendingTwoFactor();
    await authClient.signOut();
    await options.openSignupVerification();
    return;
  }

  clearPendingVerification();
  clearPendingTwoFactor();
  setPortalLoginInFlight("seller", false);
  options.navigate("/seller");
}
