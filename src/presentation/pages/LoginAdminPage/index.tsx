import { ClientIpService } from "@/app/modules/client/services/client-ip.service";
import { AppError } from "@/domain/errors/app.error";
import { authClient } from "@/infra/auth/auth-client";
import { fetchSessionContext } from "@/infra/auth/session-context-api";
import { isTwoFactorRedirect } from "@/infra/auth/two-factor-utils";
import { Input } from "@/presentation/components/Input";
import { PasswordInput } from "@/presentation/components/PasswordInput";
import { TwoFactorLoginStep } from "@/presentation/components/auth/TwoFactorLoginStep";
import { Button } from "@/presentation/components/ui/button";
import { tryOrToastError } from "@/presentation/utils/try-or-toast-error";
import { ArrowRight, Mail, Shield } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const clientIpService = new ClientIpService();

export default function LoginAdmin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);

  const completeAdminLogin = async () => {
    const ctx = await fetchSessionContext();

    if (ctx.role !== "admin") {
      throw new AppError("Acesso restrito a administradores", 403);
    }

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
          setNeedsTwoFactor(true);
          return;
        }

        await completeAdminLogin();
      },
      {
        defaultErrorMessage: "Erro ao entrar",
        defaultErrorTitle: "Erro ao entrar",
        errorFn: () => {
          authClient.signOut();
        },
        finallyFn: () => {
          setLoading(false);
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-[45%] relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-primary/[0.02]" />
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-border/40 to-transparent" />
        <div
          className="absolute top-[20%] left-[20%] w-80 h-80 bg-primary/[0.03] rounded-full blur-[100px] animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute bottom-[20%] right-[20%] w-64 h-64 bg-primary/[0.05] rounded-full blur-[80px] animate-pulse"
          style={{ animationDuration: "10s", animationDelay: "2s" }}
        />

        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative text-center px-16 animate-fade-in">
          <span className="text-3xl font-bold text-foreground block mb-8">
            Oasyfy
          </span>
          <p className="text-muted-foreground text-[13px] leading-relaxed max-w-[280px] mx-auto">
            Gerencie rotas, monitore transações e controle todo o gateway em um
            só lugar.
          </p>
          <div className="flex items-center justify-center gap-8 mt-10">
            {["Controle total", "Monitoramento", "Seguro"].map((t, i) => (
              <div
                key={t}
                className="flex items-center gap-2 text-[12px] text-muted-foreground/70 animate-fade-in"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="w-1 h-1 rounded-full bg-primary/60" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-[380px] animate-fade-in">
          <div className="lg:hidden flex justify-center mb-8">
            <span className="text-2xl font-bold text-foreground">Oasyfy</span>
          </div>

          <div className="mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center mb-5 border border-primary/10">
              <Shield className="text-primary" size={18} />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">
              Oasyfy Admin
            </h1>
            <p className="text-[13px] text-muted-foreground mt-2">
              Acesse o painel administrativo do gateway (Better Auth)
            </p>
          </div>

          {needsTwoFactor ? (
            <TwoFactorLoginStep
              onVerified={async () => {
                try {
                  await completeAdminLogin();
                } catch (err) {
                  if (err instanceof AppError) {
                    setError(err.message);
                    await authClient.signOut();
                  }
                }
              }}
              onCancel={() => {
                setNeedsTwoFactor(false);
                void authClient.signOut();
              }}
            />
          ) : (
            <form onSubmit={handleLogin} className="space-y-3.5">
              {error && (
                <div className="px-3.5 py-2.5 rounded-xl bg-destructive/5 border border-destructive/15 text-destructive text-[12px] font-medium flex items-center gap-2 animate-fade-in">
                  <span className="w-1 h-1 rounded-full bg-destructive flex-shrink-0" />
                  {error}
                </div>
              )}

              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@oasyfy.com"
                startComponent={
                  <Mail size={15} className="text-muted-foreground/40" />
                }
              />

              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Senha"
              />

              <Button
                disabled={loading}
                className="w-full !mt-3"
                loading={loading}
              >
                Entrar como Admin <ArrowRight size={15} />
              </Button>
            </form>
          )}

          <p className="text-center text-[13px] text-muted-foreground mt-6">
            É um seller?{" "}
            <a
              href="/login/seller"
              className="text-primary font-medium hover:text-primary/80 transition-colors duration-200"
            >
              Acesse aqui
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
