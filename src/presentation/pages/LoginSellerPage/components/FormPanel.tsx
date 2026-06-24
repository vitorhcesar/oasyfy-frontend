import { useApiService } from "@/presentation/hooks/use-api-service";
import { tryOrToastError } from "@/presentation/utils/try-or-toast-error";
import { useEffect, useState } from "react";
import {
  clearPendingVerification,
  loadPendingVerification,
  savePendingVerification,
} from "../seller-login-verification-storage";
import ForgotPasswordForm from "./ForgotPasswordForm";
import LoginForm from "./LoginForm";
import LoginSellerMobileLogo from "./MobileLogo";
import OtpCodeForm from "./OtpCodeForm";
import SignUpForm from "./SignUpForm";

type TFormView = "login" | "signup" | "forgotPassword" | "code";

export default function LoginSellerFormPanel() {
  const apiService = useApiService();

  const [formView, setFormView] = useState<TFormView>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
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
