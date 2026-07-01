import { ensureSellerPortalAccess } from "@/infra/auth";
import type { NavigateFunction } from "react-router-dom";
import {
  clearPendingVerification,
  savePendingVerification,
} from "./seller-login-verification-storage";
import { clearPendingTwoFactor } from "./seller-login-two-factor-storage";

export async function completeSellerPortalLogin(options: {
  email: string;
  navigate: NavigateFunction;
  openSignupVerification: () => Promise<void>;
  onError: (message: string) => void;
}): Promise<void> {
  // Persiste o e-mail ANTES de ensureSellerPortalAccess, pois esse gate chama
  // authClient.signOut() internamente, o que desmonta/remonta o FormPanel via
  // PublicRoute (isLoading=true). Ao remontar, o useEffect do FormPanel lê o
  // sessionStorage e já exibe o formulário de código sem perder o e-mail.
  savePendingVerification(options.email);

  const gate = await ensureSellerPortalAccess();

  if (gate.kind === "error") {
    clearPendingVerification();
    clearPendingTwoFactor();
    options.onError(gate.message);
    return;
  }

  if (gate.kind === "needs_verification") {
    clearPendingTwoFactor();
    await options.openSignupVerification();
    return;
  }

  clearPendingVerification();
  clearPendingTwoFactor();
  options.navigate("/seller");
}
