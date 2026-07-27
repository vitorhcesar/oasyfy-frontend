import { ClientIpService } from "@/app/modules/client/services/client-ip.service";
import { AppError } from "@/domain/errors/app.error";
import { authClient } from "@/infra/auth/auth-client";
import { fetchSessionContext } from "@/infra/auth/session-context-api";
import { isTwoFactorRedirect } from "@/infra/auth/two-factor-utils";
import { AuthAmbientBackground } from "@/presentation/components/auth/AuthAmbientBackground";
import { AuthBrandMark } from "@/presentation/components/auth/AuthBrandMark";
import { Input } from "@/presentation/components/Input";
import { PasswordInput } from "@/presentation/components/PasswordInput";
import { TwoFactorLoginStep } from "@/presentation/components/auth/TwoFactorLoginStep";
import { Button } from "@/presentation/components/ui/button";
import { useAuthContext } from "@/presentation/context/AuthContext";
import { tryOrToastError } from "@/presentation/utils/try-or-toast-error";
import { ArrowRight, Mail, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  clearPendingAdminTwoFactor,
  hasPendingAdminTwoFactor,
  savePendingAdminTwoFactor,
} from "./admin-login-two-factor-storage";

const clientIpService = new ClientIpService();

export default function LoginAdmin() {
  const navigate = useNavigate();
  const { signOut } = useAuthContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);

  useEffect(() => {
    if (hasPendingAdminTwoFactor()) {
      setNeedsTwoFactor(true);
    }
  }, []);

  const completeAdminLogin = async () => {
    const ctx = await fetchSessionContext();

    if (ctx.role !== "admin") {
      throw new AppError("Acesso restrito a administradores", 403);
    }

    clearPendingAdminTwoFactor();
    navigate("/admin");
  };

  const handleLogin = async (e: React.FormEvent) => {
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

        const signInResult = await authClient.signIn.email({
          email,
          password,
        });

        if (signInResult.error) {
          setError("Email ou senha inválidos");
          return;
        }

        if (isTwoFactorRedirect(signInResult.data)) {
          savePendingAdminTwoFactor();
          setNeedsTwoFactor(true);
          return;
        }

        await completeAdminLogin();
      },
      {
        defaultErrorMessage: "Erro ao entrar",
        defaultErrorTitle: "Erro ao entrar",
        errorFn: () => {
          void signOut();
        },
        finallyFn: () => {
          setLoading(false);
        },
      }
    );
  };

  return (
    <div className="auth-skin relative flex min-h-screen overflow-hidden bg-[#0F0617] text-foreground">
      <AuthAmbientBackground />

      <div className="relative z-10 flex min-h-screen w-full">
        <aside className="relative hidden lg:flex lg:w-[48%] xl:w-[46%] flex-col justify-between">
          <div className="relative z-10 flex h-full flex-col justify-between px-10 py-10 xl:px-14 xl:py-12">
            <AuthBrandMark
              size="lg"
              variant="white"
              className="animate-auth-reveal-left"
            />

            <div className="max-w-md animate-auth-reveal-up [animation-delay:60ms]">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
                Painel administrativo
              </p>
              <h1 className="mb-5 text-[2.85rem] font-bold leading-[1.08] tracking-tight text-white xl:text-[3.25rem]">
                Controle total
                <br />
                do gateway.
              </h1>
              <p className="max-w-sm text-base leading-relaxed text-white/55 xl:text-lg">
                Gerencie rotas, monitore transações e opere a plataforma com a
                mesma clareza de um produto de alto nível.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/40 animate-auth-reveal-up [animation-delay:120ms]">
              {["Controle total", "Monitoramento", "Seguro"].map((t) => (
                <span key={t} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#5F2998]" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </aside>

        <div className="relative flex flex-1 items-center justify-center px-6 py-10">
          <div className="relative w-full max-w-[460px]">
            <div className="mb-10 animate-auth-reveal-up lg:hidden">
              <AuthBrandMark size="lg" variant="white" />
            </div>

            <div className="relative animate-liquid-glass">
              <div className="auth-glass-glow" aria-hidden />
              <div className="liquid-glass auth-glass-sheen relative z-10 rounded-[20px] p-7 sm:rounded-3xl sm:p-9">
              <span className="auth-glass-sheen-beam" aria-hidden />
              <header className="mb-7">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/25">
                  <Shield className="text-primary" size={20} />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  OmegaPay Admin
                </h1>
                <p className="mt-2 text-base text-muted-foreground">
                  Acesse o painel administrativo do gateway
                </p>
              </header>

              {needsTwoFactor ? (
                <TwoFactorLoginStep
                  onVerified={async () => {
                    try {
                      await completeAdminLogin();
                    } catch (err) {
                      if (err instanceof AppError) {
                        setError(err.message);
                        await signOut();
                      }
                    }
                  }}
                  onCancel={() => {
                    clearPendingAdminTwoFactor();
                    setNeedsTwoFactor(false);
                    void signOut();
                  }}
                />
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  {error && (
                    <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3.5 py-3 text-sm text-destructive animate-fade-in">
                      <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-destructive" />
                      {error}
                    </div>
                  )}

                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="admin@omegapay.com"
                    className="auth-field h-12 rounded-xl text-base"
                    startComponent={
                      <Mail size={16} className="text-muted-foreground/40" />
                    }
                  />

                  <PasswordInput
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Senha"
                    className="auth-field h-12 rounded-xl text-base"
                  />

                  <Button
                    disabled={loading}
                    className="auth-cta !mt-3 h-12 w-full rounded-xl text-base font-semibold"
                    loading={loading}
                    rippleColor="rgba(15, 6, 23, 0.2)"
                  >
                    Entrar como Admin <ArrowRight size={16} />
                  </Button>
                </form>
              )}
            </div>
            </div>

            <p className="mt-6 text-center text-base text-muted-foreground">
              É um seller?{" "}
              <a
                href="/login/seller"
                className="font-semibold text-primary transition-colors hover:text-primary/80"
              >
                Acesse aqui
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
