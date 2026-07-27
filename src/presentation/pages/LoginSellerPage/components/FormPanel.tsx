import { TwoFactorLoginStep } from "@/presentation/components/auth/TwoFactorLoginStep";
import { useAuthContext } from "@/presentation/context/AuthContext";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { tryOrToastError } from "@/presentation/utils/try-or-toast-error";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const { signOut } = useAuthContext();

  const [formView, setFormView] = useState<TFormView>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorError, setTwoFactorError] = useState("");

  useEffect(() => {
    const pendingTwoFactor = loadPendingTwoFactor();
    if (pendingTwoFactor?.email) {
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

  const sendSignUpVerificationCodeAndOpenCodeFormView = async () => {
    await tryOrToastError(
      async () => {
        await apiService.modules.account.sendSignupVerificationCode(email);

        savePendingVerification(email);

        if (formView !== "code") {
          setFormView("code");
        }
      },
      {
        defaultErrorMessage: "Erro ao enviar código de verificação",
        defaultErrorTitle: "Erro ao enviar código de verificação",
      }
    );
  };

  const handleTwoFactorVerified = async () => {
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

        <div className="liquid-glass animate-liquid-glass rounded-[20px] p-7 sm:rounded-3xl sm:p-9">
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
                  {twoFactorError}
                </div>
              )}

              <TwoFactorLoginStep
                onVerified={handleTwoFactorVerified}
                onCancel={() => {
                  clearPendingTwoFactor();
                  setTwoFactorError("");
                  setFormView("login");
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

        <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground/60">
          Ao continuar, você concorda com os Termos de Uso e Política de
          Privacidade.
        </p>
      </div>
    </div>
  );
}
