import { Button } from "@/http/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import EmailRecoveryStep from "./EmailRecoveryStep";
import NewPasswordRecoveryStep from "./NewPasswordRecoveryStep";

type TRecoveryStep = "email" | "newPassword";

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

  const [loading, setLoading] = useState(false);

  const resetRecoveryState = () => {
    setRecoveryStep("email");
    setEmail("");

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
          onSuccess={() => setRecoveryStep("newPassword")}
        />
      )}

      {recoveryStep === "newPassword" && (
        <NewPasswordRecoveryStep
          email={email}
          loading={loading}
          setLoading={setLoading}
          onSuccess={resetRecoveryState}
        />
      )}

      <div className="flex items-center justify-center mt-8">
        <Button
          variant="ghost"
          onClick={resetRecoveryState}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 mx-auto"
          disabled={loading}
        >
          <ArrowLeft size={14} />
          Voltar ao login
        </Button>
      </div>
    </>
  );
}
