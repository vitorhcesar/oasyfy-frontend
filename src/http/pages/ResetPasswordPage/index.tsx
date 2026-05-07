import { Check, ShieldCheck } from "lucide-react";
import EmailStep from "./components/EmailStep";
import NewPasswordStep from "./components/NewPasswordStep";
import { useResetPasswordPageStore } from "./stores/reset-password-page.store";

export default function ResetPasswordPage() {
  const { step, success } = useResetPasswordPageStore();

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center animate-fade-in">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="relative w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="text-primary" size={28} />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Senha atualizada!
          </h2>
          <p className="text-sm text-muted-foreground">
            Redirecionando para o login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 bg-primary/[0.03] items-center justify-center relative overflow-hidden">
        <div className="relative text-center px-12">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary/10">
            <ShieldCheck className="text-primary" size={36} />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Recuperação de senha
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
            Use o código enviado por e-mail junto com sua nova senha.
          </p>
        </div>
      </div>

      {step === "email" && <EmailStep />}
      {step === "new-password" && <NewPasswordStep />}
    </div>
  );
}
