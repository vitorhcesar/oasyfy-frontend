import { getErrorMessageOrDefault } from "@/http/utils/get-error-message-or-default";
import { tryOrToastError } from "@/http/utils/try-or-toast-error";
import { authClient, ensureSellerPortalAccess } from "@/infra/auth";
import { httpClient, type IApiEnvelope } from "@/infra/http";
import { ArrowLeft, Check, Loader2, Mail, X } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

interface IOtpCodeFormProps {
  email: string;
  password: string;
  setView: (view: "login" | "signup" | "forgotPassword") => void;
  openSignupVerification: () => Promise<void>;
}

export default function OtpCodeForm({
  email,
  password,
  setView,
  openSignupVerification,
}: IOtpCodeFormProps) {
  const navigate = useNavigate();

  const [signupOtp, setSignupOtp] = useState(["", "", "", "", "", ""]);
  const [signupVerifyCountdown, setSignupVerifyCountdown] = useState(0);

  const signupOtpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loading, setLoading] = useState(false);

  const handleVerifySignupCode = async (code: string) => {
    setError("");
    setLoading(true);

    tryOrToastError(
      async () => {
        await httpClient.post<IApiEnvelope<{ success?: boolean }>>(
          "/api/v1/account/signup-verification/verify",
          { email, code }
        );

        setSuccess("E-mail verificado com sucesso! Redirecionando...");

        const loginResult = await authClient.signIn.email({
          email,
          password,
        });

        if (loginResult.error) {
          setError("E-mail verificado! Faça login para continuar.");
          setView("login");
          return;
        }

        const gate = await ensureSellerPortalAccess();
        if (gate.kind === "error") {
          setError(gate.message);
          return;
        }
        if (gate.kind === "needs_verification") {
          await openSignupVerification();
          return;
        }

        navigate("/seller");
      },
      {
        errorFn: (error) => {
          return {
            title: "Erro ao verificar código",
            description: getErrorMessageOrDefault(
              error,
              "Erro ao verificar código"
            ),
          };
        },
        finallyFn: () => {
          setLoading(false);
        },
      }
    );
  };

  const handleSignupOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...signupOtp];
    newOtp[index] = value;
    setSignupOtp(newOtp);
    if (value && index < 5) signupOtpRefs.current[index + 1]?.focus();
    const full = newOtp.join("");
    if (full.length === 6) handleVerifySignupCode(full);
  };

  const handleSignupOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !signupOtp[index] && index > 0) {
      signupOtpRefs.current[index - 1]?.focus();
    }
  };

  const handleSignupOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setSignupOtp(text.split(""));
      handleVerifySignupCode(text);
    }
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
        await openSignupVerification();
        setSuccess("Código reenviado! Verifique sua caixa de entrada.");
        startSignupVerifyCountdown();
      },
      {
        errorFn: (error) => {
          return {
            title: "Erro ao reenviar código",
            description: getErrorMessageOrDefault(
              error,
              "Erro ao reenviar código"
            ),
          };
        },
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
      {success && (
        <div className="mb-4 px-3 py-2.5 rounded-lg bg-primary/5 border border-primary/15 text-primary text-[13px] flex items-center gap-2">
          <Check size={14} className="flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div
        className="flex items-center justify-center gap-2.5 mb-6"
        onPaste={handleSignupOtpPaste}
      >
        {signupOtp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              signupOtpRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleSignupOtpChange(i, e.target.value)}
            onKeyDown={(e) => handleSignupOtpKeyDown(i, e)}
            disabled={loading}
            className="w-11 h-12 text-center text-lg font-semibold rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors disabled:opacity-50"
            autoFocus={i === 0}
          />
        ))}
      </div>

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

      <div className="text-center mt-6">
        <button
          onClick={() => {
            setView("login");
            setError("");
            setSuccess("");
          }}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 mx-auto"
        >
          <ArrowLeft size={14} />
          Voltar ao login
        </button>
      </div>
    </div>
  );
}
