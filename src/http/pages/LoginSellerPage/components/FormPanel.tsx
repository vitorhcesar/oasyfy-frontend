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

  const inputClass =
    "w-full pl-9 pr-4 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors";

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
            inputClass={inputClass}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            openSignupVerification={openSignupVerification}
            setView={setFormView}
          />
        )}

        {formView === "signup" && (
          <SignUpForm
            inputClass={inputClass}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            openSignupVerification={openSignupVerification}
            setView={setFormView}
          />
        )}

        {formView === "forgotPassword" && (
          <ForgotPasswordForm
            inputClass={inputClass}
            setFormView={setFormView}
            email={email}
            setEmail={setEmail}
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
