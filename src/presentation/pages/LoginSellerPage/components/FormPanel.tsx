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
    <div className="flex-1 flex items-center justify-center px-6 py-8">
      <div className="w-full max-w-[400px]">
        <LoginSellerMobileLogo />

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
              <h1 className="text-xl font-semibold text-foreground">Entrar</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Confirme o código do autenticador para continuar
              </p>
            </header>

            {twoFactorError && (
              <div className="px-3 py-2.5 rounded-lg bg-destructive/5 border border-destructive/15 text-destructive text-[13px] mb-4">
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

        <p className="text-center text-[11px] text-muted-foreground/50 mt-8">
          Ao continuar, você concorda com os Termos de Uso e Política de
          Privacidade.
        </p>
      </div>
    </div>
  );
}
