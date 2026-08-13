import { ClientIpService } from "@/app/modules/client/services/client-ip.service";
import { AppError } from "@/domain/errors/app.error";
import { authClient } from "@/infra/auth";
import { isTwoFactorRedirect } from "@/infra/auth/two-factor-utils";
import { Input } from "@/presentation/components/Input";
import { Label } from "@/presentation/components/Label";
import { PasswordInput } from "@/presentation/components/PasswordInput";
import { Button } from "@/presentation/components/ui/button";
import { translateError } from "@/presentation/utils/translate-error";
import { tryOrToastError } from "@/presentation/utils/try-or-toast-error";
import { ArrowRight, Mail, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { completeSellerPortalLogin } from "../seller-login-completion";
import { savePendingTwoFactor } from "../seller-login-two-factor-storage";

const clientIpService = new ClientIpService();

interface ILoginFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  openSignupVerification: () => Promise<void>;
  openTwoFactorStep: () => void;
  setView: (view: "login" | "signup" | "forgotPassword" | "twoFactor") => void;
}

export default function LoginForm({
  email,
  setEmail,
  password,
  setPassword,
  openSignupVerification,
  openTwoFactorStep,
  setView,
}: ILoginFormProps) {
  const navigate = useNavigate();

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

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
          const raw =
            signInResult.error.message || signInResult.error.code || "";
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

        if (isTwoFactorRedirect(signInResult.data)) {
          // After that 2FA is pending before the session refetch triggered by
          // sign-in remounts this page via PublicRoute.
          savePendingTwoFactor(email);
          openTwoFactorStep();
          return;
        }

        await completeSellerPortalLogin({
          email,
          navigate,
          openSignupVerification,
          onError: setError,
        });
      },
      {
        defaultErrorMessage: "Erro ao entrar",
        defaultErrorTitle: "Erro ao entrar",
        finallyFn: () => {
          setLoading(false);
        },
      }
    );
  };

  const handleGoToSignup = () => {
    setError("");
    setView("signup");
    setEmail("");
    setPassword("");
  };

  const handleGoToForgotPassword = () => {
    setError("");
    setView("forgotPassword");
    setEmail("");
    setPassword("");
  };

  return (
    <>
      <header className="mb-7">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Entrar
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Acesse sua conta para continuar
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3.5 py-3 text-sm text-destructive">
            <X size={15} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="seu@email.com"
            className="auth-field h-12 rounded-xl text-base"
            startComponent={
              <Mail size={17} className="text-muted-foreground/50" />
            }
          />
        </div>

        <div>
          <Label htmlFor="password">Senha</Label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="••••••••"
            className="auth-field h-12 rounded-xl text-base"
          />

          <div className="mt-2.5 text-right">
            <button
              type="button"
              onClick={handleGoToForgotPassword}
              className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              Esqueci minha senha
            </button>
          </div>
        </div>

        <Button
          className="auth-cta !mt-3 h-12 w-full rounded-xl text-base font-semibold"
          loading={loading}
          rippleColor="rgba(15, 15, 16, 0.2)"
        >
          Entrar <ArrowRight size={16} />
        </Button>
      </form>

      <div className="mt-7 text-center">
        <button
          onClick={handleGoToSignup}
          className="text-base text-muted-foreground transition-colors hover:text-foreground"
        >
          Não tem conta?{" "}
          <span className="font-semibold text-primary">Cadastre-se</span>
        </button>
      </div>
    </>
  );
}
