import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import CodeRecoveryStep from "./CodeRecoveryStep";
import EmailRecoveryStep from "./EmailRecoveryStep";
import NewPasswordRecoveryStep from "./NewPasswordRecoveryStep";

type TRecoveryStep = "email" | "code" | "newPassword";

interface IForgotPasswordFormProps {
  setFormView: (view: "login" | "signup" | "forgotPassword") => void;
  email: string;
  setEmail: (email: string) => void;
}

export default function ForgotPasswordForm({
  setFormView,
  email,
  setEmail,
}: IForgotPasswordFormProps) {
  const [recoveryStep, setRecoveryStep] = useState<TRecoveryStep>("email");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);

  const [loading, setLoading] = useState(false);

  const resetRecoveryState = () => {
    setRecoveryStep("email");
    setEmail("");
    setOtpDigits(["", "", "", "", "", ""]);

    setFormView("login");
  };

  return (
    <>
      {recoveryStep === "email" && (
        <EmailRecoveryStep
          email={email}
          setEmail={setEmail}
          loading={loading}
          setLoading={setLoading}
          onSuccess={() => setRecoveryStep("code")}
        />
      )}

      {recoveryStep === "code" && (
        <CodeRecoveryStep
          email={email}
          otpDigits={otpDigits}
          setOtpDigits={setOtpDigits}
          loading={loading}
          setLoading={setLoading}
          onSuccess={() => setRecoveryStep("newPassword")}
        />
      )}

      {recoveryStep === "newPassword" && (
        <NewPasswordRecoveryStep
          email={email}
          otpDigits={otpDigits}
          loading={loading}
          setLoading={setLoading}
          onSuccess={resetRecoveryState}
        />
      )}

      <div className="text-center mt-8">
        <button
          onClick={resetRecoveryState}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 mx-auto"
          disabled={loading}
        >
          <ArrowLeft size={14} />
          Voltar ao login
        </button>
      </div>
    </>
  );
}
