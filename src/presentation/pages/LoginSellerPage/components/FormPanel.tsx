import { TwoFactorLoginStep } from "@/presentation/components/auth/TwoFactorLoginStep";
import { setPortalLoginInFlight } from "@/presentation/components/auth/portal-login-lock";
import { useAuthContext } from "@/presentation/context/AuthContext";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { completeSellerPortalLogin } from "../seller-login-completion";
import {
  clearPendingVerification,
  loadPendingVerification,
  savePendingVerification,
} from "../seller-login-verification-storage";
import {
  clearPendingTwoFactor,
  loadPendingTwoFactor,
} from "../seller-login-two-factor-storage";
import ForgotPasswordForm from "./ForgotPasswordForm";
import LoginForm from "./LoginForm";
import LoginSellerMobileLogo from "./MobileLogo";
import OtpCodeForm from "./OtpCodeForm";
import SignUpForm from "./SignUpForm";

type TFormView = "login" | "signup" | "forgotPassword" | "code" | "twoFactor";

export default function LoginSellerFormPanel() {
  const navigate = useNavigate();
  const apiService = useApiService();
  const { signOut, isAuthenticated, isLoading } = useAuthContext();

  const [formView, setFormView] = useState<TFormView>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorError, setTwoFactorError] = useState("");

  useEffect(() => {
    const pendingTwoFactor = loadPendingTwoFactor();
    if (pendingTwoFactor?.email) {
      setPortalLoginInFlight("seller", true);
      setEmail(pendingTwoFactor.email);
      setFormView("twoFactor");
      return;
    }

    const pending = loadPendingVerification();
    if (pending?.email) {
      setEmail(pending.email);
      setFormView("code");
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated || isLoading) return;
    if (loadPendingTwoFactor() || loadPendingVerification()) return;
    setPortalLoginInFlight("seller", false);
  }, [isAuthenticated, isLoading]);

  const sendSignUpVerificationCodeAndOpenCodeFormView = async () => {
    await apiService.modules.account.sendSignupVerificationCode(email);

    savePendingVerification(email);

    if (formView !== "code") {
      setFormView("code");
    }
  };

  const handleTwoFactorVerified = async () => {
    setPortalLoginInFlight("seller", true);
    await completeSellerPortalLogin({
      email,
      navigate,
      openSignupVerification: sendSignUpVerificationCodeAndOpenCodeFormView,
      onError: setTwoFactorError,
    });
  };

  return (
    <div className="relative flex flex-1 items-center justify-center px-6 py-10">
      <div className="relative w-full max-w-[460px]">
        <LoginSellerMobileLogo />

        <div className="relative">
          <div className="auth-glass-glow" aria-hidden />
          <div className="liquid-glass relative z-10 rounded-[20px] p-7 sm:rounded-3xl sm:p-9">
            {formView === "code" && (
              <OtpCodeForm
                email={email}
                password={password}
                setView={setFormView}
                resendSignUpVerificationCode={
                  sendSignUpVerificationCodeAndOpenCodeFormView
                }
                onVerificationDone={clearPendingVerification}
              />
            )}

            {formView === "twoFactor" && (
              <>
                <header className="mb-7">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Entrar
                  </h1>
                  <p className="mt-2 text-base text-muted-foreground">
                    Confirme o código do autenticador para continuar
                  </p>
                </header>

                {twoFactorError && (
                  <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-3.5 py-3 text-sm text-destructive">
                    <p>{twoFactorError}</p>
                    {twoFactorError.includes("login de admin") && (
                      <a
                        href="/login/admin"
                        className="mt-2 inline-block font-semibold text-primary hover:text-primary/80"
                      >
                        Ir para o login de admin
                      </a>
                    )}
                  </div>
                )}

                <TwoFactorLoginStep
                  onVerified={handleTwoFactorVerified}
                  onCancel={() => {
                    clearPendingTwoFactor();
                    setTwoFactorError("");
                    setFormView("login");
                    setPortalLoginInFlight("seller", false);
                    void signOut();
                  }}
                />
              </>
            )}

            {formView === "login" && (
              <LoginForm
                email={email}
                setEmail={setEmail}
                password={password}
                setView={setFormView}
                setPassword={setPassword}
                openSignupVerification={
                  sendSignUpVerificationCodeAndOpenCodeFormView
                }
                openTwoFactorStep={() => setFormView("twoFactor")}
              />
            )}

            {formView === "signup" && (
              <SignUpForm
                email={email}
                setEmail={setEmail}
                password={password}
                setView={setFormView}
                setPassword={setPassword}
                onSuccess={sendSignUpVerificationCodeAndOpenCodeFormView}
              />
            )}

            {formView === "forgotPassword" && (
              <ForgotPasswordForm
                email={email}
                setEmail={setEmail}
                setFormView={setFormView}
              />
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground/60">
          Ao continuar, você concorda com os{" "}
          <Link
            to="/termos"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition-colors hover:text-muted-foreground"
          >
            Termos de Uso
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
