import { OtpInput } from "@/http/components/OtpInput";
import { Button } from "@/http/components/ui/button";
import { useApiService } from "@/http/hooks/use-api-service";
import { toast } from "@/http/hooks/use-toast";
import { tryOrToastError } from "@/http/utils/try-or-toast-error";
import { authClient } from "@/infra/auth";
import { ArrowLeft, Loader2, Mail, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface IOtpCodeFormProps {
  email: string;
  password: string;
  setView: (view: "login" | "signup" | "forgotPassword") => void;
  resendSignUpVerificationCode: () => Promise<void>;
}

export default function OtpCodeForm({
  email,
  password,
  setView,
  resendSignUpVerificationCode,
}: IOtpCodeFormProps) {
  const navigate = useNavigate();

  const apiService = useApiService();

  const [otpCode, setOtpCode] = useState("");
  const [signupVerifyCountdown, setSignupVerifyCountdown] = useState(0);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerifySignupCode = async (code: string) => {
    setError("");

    setLoading(true);

    tryOrToastError(
      async () => {
        await apiService.modules.account.verifySignupVerification(
          email,
          code.trim()
        );

        const loginResult = await authClient.signIn.email({
          email,
          password,
        });

        if (loginResult.error) {
          toast({
            title: "E-mail verificado com sucesso!",
            description: "Faça login para continuar",
          });
          setView("login");
          return;
        }

        toast({
          title: "E-mail verificado com sucesso!",
          description: "Redirecionando você para o painel de vendas...",
        });

        // const gate = await ensureSellerPortalAccess();
        // if (gate.kind === "error") {
        //   setError(gate.message);
        //   return;
        // }
        // if (gate.kind === "needs_verification") {
        //   await openSignupVerification();
        //   return;
        // }

        setTimeout(() => {
          console.log("navigate to seller");
          navigate("/seller");
        }, 1000);
      },
      {
        defaultErrorTitle: "Erro ao verificar código",
        defaultErrorMessage: "Erro ao verificar código",
        finallyFn: () => {
          setLoading(false);
        },
      }
    );
  };

  const startSignupVerifyCountdown = () => {
    setSignupVerifyCountdown(60);
    const timer = setInterval(() => {
      setSignupVerifyCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendSignupCode = async () => {
    setError("");
    setLoading(true);

    tryOrToastError(
      async () => {
        await resendSignUpVerificationCode();
        toast({
          title: "Código reenviado!",
          description: "Verifique sua caixa de entrada",
        });
        startSignupVerifyCountdown();
      },
      {
        defaultErrorMessage: "Erro ao reenviar código",
        defaultErrorTitle: "Erro ao reenviar código",
        finallyFn: () => {
          setLoading(false);
        },
      }
    );
  };

  return (
    <div>
      <div className="mb-8">
        <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
          <Mail className="text-primary" size={20} />
        </div>
        <h1 className="text-xl font-semibold text-foreground">
          Verifique seu e-mail
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          Enviamos um código de 6 dígitos para{" "}
          <span className="font-medium text-foreground">{email}</span>
        </p>
      </div>

      {error && (
        <div className="mb-4 px-3 py-2.5 rounded-lg bg-destructive/5 border border-destructive/15 text-destructive text-[13px] flex items-center gap-2">
          <X size={14} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <OtpInput
        value={otpCode}
        onChange={setOtpCode}
        onFullfilled={handleVerifySignupCode}
        disabled={loading}
      />

      {loading && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
          <Loader2 size={14} className="animate-spin" />
          Verificando...
        </div>
      )}

      <div className="text-center space-y-2">
        <p className="text-xs text-muted-foreground">
          {signupVerifyCountdown > 0 ? (
            <>
              Reenviar em{" "}
              <span className="font-mono font-medium text-foreground">
                {signupVerifyCountdown}s
              </span>
            </>
          ) : (
            "Não recebeu o código?"
          )}
        </p>

        <button
          type="button"
          onClick={handleResendSignupCode}
          disabled={loading || signupVerifyCountdown > 0}
          className="text-xs font-medium text-primary hover:text-primary/80 disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
        >
          Reenviar código
        </button>
      </div>

      <div className="flex items-center justify-center mt-6">
        <Button
          variant="ghost"
          onClick={() => {
            setView("login");
            setError("");
          }}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft size={14} />
          Voltar ao login
        </Button>
      </div>
    </div>
  );
}
