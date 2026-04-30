import type { IApiEnvelope } from "@/infra/http/api-types";
import { httpClient } from "@/infra/http/http-client";
import { ArrowRight, Check, Lock, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setError("Insira um e-mail válido");
      setLoading(false);
      return;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Informe o código de 6 dígitos enviado ao e-mail");
      setLoading(false);
      return;
    }
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

    try {
      await httpClient.post<IApiEnvelope<{ success?: boolean }>>(
        "/api/v1/account/password-recovery/verify",
        {
          email: email.trim(),
          code: code.trim(),
          new_password: password,
        }
      );
    } catch (err: unknown) {
      const msg =
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        err.response !== null &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        err.response.data !== null &&
        "message" in err.response.data &&
        typeof (err.response.data as { message: unknown }).message === "string"
          ? (err.response.data as { message: string }).message
          : "Não foi possível atualizar a senha.";
      setError(msg);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => navigate("/login/seller"), 2500);
  };

  const inputClass =
    "w-full pl-10 pr-3 py-3 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

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

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-8 lg:hidden text-center">
            <span className="text-xl font-bold text-foreground">Oasyfy</span>
          </div>

          <div className="mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Lock className="text-primary" size={22} />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Nova senha</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Better Auth — confirme e-mail, código e nova senha
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="px-4 py-3 rounded-xl bg-destructive/8 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive flex-shrink-0" />
                {error}
              </div>
            )}

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass.replace("pl-10", "pl-3")}
              placeholder="E-mail da conta"
            />

            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              required
              maxLength={6}
              className={`${inputClass.replace(
                "pl-10",
                "pl-3"
              )} tracking-widest text-center font-mono`}
              placeholder="Código de 6 dígitos"
            />

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
              type="button"
              onClick={() => navigate("/login/seller")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Voltar ao login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
