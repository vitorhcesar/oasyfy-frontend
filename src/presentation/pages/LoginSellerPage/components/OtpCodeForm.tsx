import { authClient } from "@/infra/auth";
import { OtpInput } from "@/presentation/components/OtpInput";
import { Button } from "@/presentation/components/ui/button";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { toast } from "@/presentation/hooks/use-toast";
import { getErrorMessageOrDefault } from "@/presentation/utils/get-error-message-or-default";
import { tryOrToastError } from "@/presentation/utils/try-or-toast-error";
import { ArrowLeft, Loader2, Mail, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface IOtpCodeFormProps {
  email: string;
  password: string;
  setView: (view: "login" | "signup" | "forgotPassword") => void;
  resendSignUpVerificationCode: () => Promise<void>;
  onVerificationDone: () => void;
}

export default function OtpCodeForm({
  email,
  password,
  setView,
  resendSignUpVerificationCode,
  onVerificationDone,
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
          onVerificationDone();
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

        onVerificationDone();

        setTimeout(() => {
          navigate("/seller");
        }, 1000);
      },
      {
        defaultErrorTitle: "Erro ao verificar código",
        defaultErrorMessage: "Erro ao verificar código",
        errorFn: (error) => {
          setError(
            getErrorMessageOrDefault(error, "Erro ao verificar código"),
          );
        },
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
        errorFn: (error) => {
          setError(
            getErrorMessageOrDefault(error, "Erro ao reenviar código"),
          );
        },
        finallyFn: () => {
          setLoading(false);
        },
      }
    );
  };

  return (
    <div>
      <header className="mb-8">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/25">
          <Mail className="text-primary" size={22} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Verifique seu e-mail
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Enviamos um código de 6 dígitos para{" "}
          <span className="font-medium text-foreground">{email}</span>
        </p>
      </header>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3.5 py-3 text-sm text-destructive">
          <X size={15} className="flex-shrink-0" />
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
        <div className="mb-4 flex items-center justify-center gap-2 text-base text-muted-foreground">
          <Loader2 size={15} className="animate-spin" />
          Verificando...
        </div>
      )}

      <div className="space-y-2 text-center">
        <p className="text-sm text-muted-foreground">
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
          className="text-sm font-medium text-primary transition-colors hover:text-primary/80 disabled:cursor-not-allowed disabled:text-muted-foreground"
        >
          Reenviar código
        </button>
      </div>

      <div className="mt-6 flex items-center justify-center">
        <Button
          variant="ghost"
          onClick={() => {
            onVerificationDone();
            setView("login");
            setError("");
          }}
          className="flex items-center gap-1.5 text-base text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={15} />
          Voltar ao login
        </Button>
      </div>
    </div>
  );
}
