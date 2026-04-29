import { ClientIpService } from "@/app/modules/client/services/client-ip.service";
import { supabase } from "@/infra/integrations/supabase/client";
import {
  ArrowRight,
  Loader2,
  Lock,
  Mail,
  Shield,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const clientIpService = new ClientIpService();

type TLoginStep = "credentials" | "mfa";

export default function LoginAdmin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // MFA state
  const [step, setStep] = useState<TLoginStep>("credentials");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaFactorId, setMfaFactorId] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const ip = await clientIpService.getClientIp();
    if (!ip) {
      setError(
        "Erro ao identificar seu IP. Verifique sua conexão e tente novamente."
      );
      setLoading(false);
      return;
    }

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Email ou senha inválidos");
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from("login_logs").insert({
        user_id: data.user.id,
        ip_address: ip,
        user_agent: navigator.userAgent,
      });

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "admin")
        .limit(1);

      if (!roleData || roleData.length === 0) {
        await supabase.auth.signOut();
        setError("Acesso restrito a administradores");
        setLoading(false);
        return;
      }

      // Check if admin has MFA enrolled
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.find((f) => f.status === "verified");

      if (totpFactor) {
        // Admin has 2FA — require code
        setMfaFactorId(totpFactor.id);
        setStep("mfa");
        setLoading(false);
        return;
      }

      // No 2FA — go directly
      navigate("/admin");
    }

    setLoading(false);
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaCode.length !== 6) {
      setError("Digite o código de 6 dígitos");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
      if (challengeError) {
        setError(challengeError.message);
        setLoading(false);
        return;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challenge.id,
        code: mfaCode,
      });

      if (verifyError) {
        setError("Código inválido. Tente novamente.");
        setMfaCode("");
        setLoading(false);
        return;
      }

      navigate("/admin");
    } catch {
      setError("Erro ao verificar código 2FA");
    }
    setLoading(false);
  };

  const inputClass =
    "w-full pl-10 pr-3 py-3 rounded-xl bg-background border border-border/60 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all duration-300";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
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

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-[380px] animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <span className="text-2xl font-bold text-foreground">Oasyfy</span>
          </div>

          {step === "credentials" && (
            <>
              <div className="mb-8">
                <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center mb-5 border border-primary/10">
                  <Shield className="text-primary" size={18} />
                </div>
                <h1 className="text-xl font-semibold tracking-tight">
                  Oasyfy Admin
                </h1>
                <p className="text-[13px] text-muted-foreground mt-2">
                  Acesse o painel administrativo do gateway
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-3.5">
                {error && (
                  <div className="px-3.5 py-2.5 rounded-xl bg-destructive/5 border border-destructive/15 text-destructive text-[12px] font-medium flex items-center gap-2 animate-fade-in">
                    <span className="w-1 h-1 rounded-full bg-destructive flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="relative">
                  <Mail
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={inputClass}
                    placeholder="admin@oasyfy.com"
                  />
                </div>

                <div className="relative">
                  <Lock
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={inputClass}
                    placeholder="Senha"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold hover:brightness-110 transition-all duration-300 disabled:opacity-40 flex items-center justify-center gap-2 mt-1"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    <>
                      Entrar como Admin <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {step === "mfa" && (
            <>
              <div className="mb-8">
                <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center mb-5 border border-primary/10">
                  <ShieldCheck className="text-primary" size={18} />
                </div>
                <h1 className="text-xl font-semibold tracking-tight">
                  Verificação 2FA
                </h1>
                <p className="text-[13px] text-muted-foreground mt-2">
                  Digite o código do Google Authenticator para continuar
                </p>
              </div>

              <form onSubmit={handleMfaVerify} className="space-y-4">
                {error && (
                  <div className="px-3.5 py-2.5 rounded-xl bg-destructive/5 border border-destructive/15 text-destructive text-[12px] font-medium flex items-center gap-2 animate-fade-in">
                    <span className="w-1 h-1 rounded-full bg-destructive flex-shrink-0" />
                    {error}
                  </div>
                )}

                <input
                  type="text"
                  value={mfaCode}
                  onChange={(e) =>
                    setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  className="w-full px-4 py-3.5 rounded-xl bg-background border border-border/60 text-center text-2xl font-mono tracking-[0.5em] text-foreground placeholder:text-muted-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all duration-300"
                />

                <button
                  type="submit"
                  disabled={loading || mfaCode.length !== 6}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold hover:brightness-110 transition-all duration-300 disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      Verificar <ArrowRight size={15} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setStep("credentials");
                    setMfaCode("");
                    setError("");
                  }}
                  className="w-full py-2.5 rounded-xl border border-border/40 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-all duration-200"
                >
                  Voltar ao login
                </button>
              </form>
            </>
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
