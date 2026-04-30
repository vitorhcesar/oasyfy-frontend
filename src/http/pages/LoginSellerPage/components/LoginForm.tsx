import { ClientIpService } from "@/app/modules/client/services/client-ip.service";
import { AppError } from "@/domain/errors/app.error";
import { getErrorMessageOrDefault } from "@/http/utils/get-error-message-or-default";
import { translateError } from "@/http/utils/translate-error";
import { tryOrToastError } from "@/http/utils/try-or-toast-error";
import { authClient, ensureSellerPortalAccess } from "@/infra/auth";
import { ArrowRight, Check, Eye, EyeOff, Lock, Mail, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const clientIpService = new ClientIpService();

interface ILoginFormProps {
  inputClass: string;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  openSignupVerification: () => Promise<void>;
  setView: (view: "login" | "signup" | "forgotPassword") => void;
}

export default function LoginForm({
  inputClass,
  email,
  setEmail,
  password,
  setPassword,
  openSignupVerification,
  setView,
}: ILoginFormProps) {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    setLoading(true);

    tryOrToastError(
      async () => {
        const ip = await clientIpService.getClientIp();
        if (!ip) {
          throw new AppError(
            "Erro ao identificar seu IP. Verifique sua conexão e tente novamente.",
            400
          );
        }
        void ip;

        const signInResult = await authClient.signIn.email({
          email,
          password,
        });

        if (signInResult.error) {
          const raw = signInResult.error.message ?? "";
          if (
            raw.toLowerCase().includes("confirm") ||
            raw.toLowerCase().includes("verified") ||
            raw.toLowerCase().includes("verify")
          ) {
            await openSignupVerification();
            return;
          }

          throw new AppError(translateError(raw), 400);
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
        errorFn: (error) => ({
          title: "Erro ao entrar",
          description: getErrorMessageOrDefault(error, "Erro ao entrar"),
        }),
        finallyFn: () => {
          setLoading(false);
        },
      }
    );
  };

  const handleGoToSignup = () => {
    setError("");
    setSuccess("");
    setView("signup");
    setEmail("");
    setPassword("");
    setShowPassword(false);
  };

  const handleGoToForgotPassword = () => {
    setError("");
    setSuccess("");
    setView("forgotPassword");
    setEmail("");
    setPassword("");
    setShowPassword(false);
  };

  return (
    <>
      <header className="mb-7">
        <h1 className="text-xl font-semibold text-foreground">Entrar</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Acesse sua conta para continuar
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="px-3 py-2.5 rounded-lg bg-destructive/5 border border-destructive/15 text-destructive text-[13px] flex items-center gap-2">
            <X size={14} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="px-3 py-2.5 rounded-lg bg-primary/5 border border-primary/15 text-primary text-[13px] flex items-center gap-2">
            <Check size={14} className="flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Email
          </label>
          <div className="relative">
            <Mail
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
              placeholder="seu@email.com"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Senha
          </label>
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50"
            />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className={inputClass + " pr-10"}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="text-right mt-1.5">
            <button
              type="button"
              onClick={handleGoToForgotPassword}
              className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Esqueci minha senha
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-[0.99] transition-all disabled:opacity-40 flex items-center justify-center gap-2 mt-1"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <>
              Entrar <ArrowRight size={15} />
            </>
          )}
        </button>
      </form>

      <div className="text-center mt-6">
        <button
          onClick={handleGoToSignup}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Não tem conta?{" "}
          <span className="text-primary font-medium">Cadastre-se</span>
        </button>
      </div>
    </>
  );
}
