import { toast } from "@/http/hooks/use-toast";
import { IApiEnvelope, httpClient } from "@/infra/http";
import { useState } from "react";
import ForgotPasswordForm from "./ForgotPasswordForm";
import LoginForm from "./LoginForm";
import LoginSellerMobileLogo from "./MobileLogo";
import OtpCodeForm from "./OtpCodeForm";
import SignUpForm from "./SignUpForm";

type TFormView = "login" | "signup" | "forgotPassword" | "code";

export default function LoginSellerFormPanel() {
  const [formView, setFormView] = useState<TFormView>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const openSignupVerification = async () => {
    try {
      await httpClient.post<IApiEnvelope<unknown>>(
        "/api/v1/account/signup-verification/send",
        { email }
      );
      setFormView("code");
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao enviar código de verificação",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    }
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
            openSignupVerification={openSignupVerification}
          />
        )}

        {formView === "login" && (
          <LoginForm
            email={email}
            setEmail={setEmail}
            password={password}
            setView={setFormView}
            setPassword={setPassword}
            openSignupVerification={openSignupVerification}
          />
        )}

        {formView === "signup" && (
          <SignUpForm
            email={email}
            setEmail={setEmail}
            password={password}
            setView={setFormView}
            setPassword={setPassword}
            openSignupVerification={openSignupVerification}
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
