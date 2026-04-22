import { supabase } from "@/infrastructure/integrations/supabase/client";
import { translateError } from "@/presentation/utils/translate-error";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Lock,
  ShieldCheck,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const passwordChecks = [
    { label: "8+ caracteres", ok: password.length >= 8 },
    { label: "Maiúscula", ok: /[A-Z]/.test(password) },
    { label: "Minúscula", ok: /[a-z]/.test(password) },
    { label: "Número", ok: /\d/.test(password) },
    { label: "Especial", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const allChecksPass = passwordChecks.every((c) => c.ok);
  const passwordScore = passwordChecks.filter((c) => c.ok).length;
  const strengthColor =
    passwordScore <= 1
      ? "bg-destructive"
      : passwordScore <= 2
      ? "bg-destructive/70"
      : passwordScore <= 3
      ? "bg-yellow-500"
      : passwordScore <= 4
      ? "bg-primary/70"
      : "bg-primary";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!allChecksPass) {
      setError("A senha não atende os requisitos");
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(translateError(updateError.message));
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => navigate("/login/seller"), 2500);
  };

  const inputClass =
    "w-full pl-10 pr-3 py-3 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

  // Invalid/expired link screen
  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-background flex">
        {/* Left decorative panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-primary/[0.03] items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0">
            <div
              className="absolute top-1/4 left-1/3 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse"
              style={{ animationDuration: "4s" }}
            />
            <div
              className="absolute bottom-1/4 right-1/3 w-56 h-56 bg-primary/8 rounded-full blur-3xl animate-pulse"
              style={{ animationDuration: "6s", animationDelay: "1s" }}
            />
          </div>
          <div className="relative text-center px-12">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary/10">
              <ShieldCheck className="text-primary" size={36} />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Recuperação de senha
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
              Use o link enviado para seu email para redefinir sua senha com
              segurança.
            </p>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-sm animate-fade-in text-center">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div
                className="absolute inset-0 rounded-full bg-destructive/10 animate-pulse"
                style={{ animationDuration: "2s" }}
              />
              <div className="relative w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="text-destructive" size={28} />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Link inválido ou expirado
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              O link de recuperação que você usou não é mais válido. Solicite um
              novo link na página de login.
            </p>
            <button
              onClick={() => navigate("/login/seller")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              <ArrowLeft size={16} />
              Voltar para o login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-background flex">
        <div className="hidden lg:flex lg:w-1/2 bg-primary/[0.03] items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0">
            <div
              className="absolute top-1/4 left-1/3 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse"
              style={{ animationDuration: "4s" }}
            />
            <div
              className="absolute bottom-1/4 right-1/3 w-56 h-56 bg-primary/8 rounded-full blur-3xl animate-pulse"
              style={{ animationDuration: "6s", animationDelay: "1s" }}
            />
          </div>
          <div className="relative text-center px-12">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary/10">
              <ShieldCheck className="text-primary" size={36} />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Tudo certo!
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
              Sua senha foi atualizada com sucesso.
            </p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-sm animate-fade-in text-center">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div
                className="absolute inset-0 rounded-full bg-primary/10 animate-ping"
                style={{ animationDuration: "2s" }}
              />
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
            <div className="mt-6">
              <div className="w-32 h-1 rounded-full bg-muted mx-auto overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full animate-pulse"
                  style={{ width: "60%", animationDuration: "1s" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Reset password form
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary/[0.03] items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0">
          <div
            className="absolute top-1/4 left-1/3 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse"
            style={{ animationDuration: "4s" }}
          />
          <div
            className="absolute bottom-1/4 right-1/3 w-56 h-56 bg-primary/8 rounded-full blur-3xl animate-pulse"
            style={{ animationDuration: "6s", animationDelay: "1s" }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-primary/4 rounded-full blur-2xl animate-pulse"
            style={{ animationDuration: "5s", animationDelay: "2s" }}
          />
        </div>
        <div className="relative text-center px-12">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary/10">
            <Lock className="text-primary" size={36} />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Redefinir senha
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
            Escolha uma nova senha forte para proteger sua conta. Sua segurança
            é nossa prioridade.
          </p>
          <div className="flex items-center justify-center gap-6 mt-10">
            {["Seguro", "Criptografado", "Privado"].map((t) => (
              <div
                key={t}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-8 lg:text-left">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto lg:mx-0 mb-4">
              <ShieldCheck className="text-primary" size={22} />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Nova senha</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Escolha uma nova senha segura para sua conta
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="px-4 py-3 rounded-xl bg-destructive/8 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className={inputClass}
                  placeholder="Nova senha"
                />
              </div>
              {password && (
                <>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          i < passwordScore ? strengthColor : "bg-border"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                    {passwordChecks.map((c) => (
                      <p
                        key={c.label}
                        className={`text-xs md:text-sm flex items-center gap-1 ${
                          c.ok ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {c.ok ? <Check size={11} /> : <X size={11} />} {c.label}
                      </p>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className={inputClass}
                placeholder="Confirmar nova senha"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Atualizar senha <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <button
              onClick={() => navigate("/login/seller")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Voltar para o{" "}
              <span className="text-primary font-medium">login</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
