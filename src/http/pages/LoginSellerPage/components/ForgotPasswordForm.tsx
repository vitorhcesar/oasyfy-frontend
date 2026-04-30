import { toast } from "@/http/hooks/use-toast";
import { getErrorMessageOrDefault } from "@/http/utils/get-error-message-or-default";
import { tryOrToastError } from "@/http/utils/try-or-toast-error";
import { IApiEnvelope, httpClient } from "@/infra/http";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  X,
} from "lucide-react";
import { useState } from "react";
import { z } from "zod";

type TRecoveryStep = "email" | "code" | "newPassword";

const emailSchema = z.string().email("Insira um email válido");

interface IForgotPasswordFormProps {
  inputClass: string;
  setFormView: (view: "login" | "signup" | "forgotPassword") => void;
  email: string;
  setEmail: (email: string) => void;
}

export default function ForgotPasswordForm({
  inputClass,
  setFormView,
  email,
  setEmail,
}: IForgotPasswordFormProps) {
  const [recoveryStep, setRecoveryStep] = useState<TRecoveryStep>("email");

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  const newPwChecks = [
    { label: "Mínimo 8 caracteres", ok: newPassword.length >= 8 },
    { label: "Letra maiúscula", ok: /[A-Z]/.test(newPassword) },
    { label: "Letra minúscula", ok: /[a-z]/.test(newPassword) },
    { label: "Número", ok: /\d/.test(newPassword) },
    { label: "Caractere especial", ok: /[^A-Za-z0-9]/.test(newPassword) },
  ];
  const newPwStrong = newPwChecks.every((c) => c.ok);
  const newPwScore = newPwChecks.filter((c) => c.ok).length;
  const newPwStrengthColor =
    newPwScore <= 1
      ? "bg-destructive"
      : newPwScore <= 2
      ? "bg-destructive/70"
      : newPwScore <= 3
      ? "bg-warning"
      : newPwScore <= 4
      ? "bg-primary/70"
      : "bg-primary";

  const handleSendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();

    setError("");
    setSuccess("");

    const targetEmail = email.trim();

    const result = emailSchema.safeParse(targetEmail);

    if (!result.success) {
      setError("Insira um email válido");
      setLoading(false);
      return;
    }

    setLoading(true);

    tryOrToastError(
      async () => {
        await httpClient.post<IApiEnvelope<unknown>>(
          "/api/v1/account/password-recovery/send",
          {
            email: targetEmail,
          }
        );
        setEmail(targetEmail);
        setRecoveryStep("code");
        setSuccess("Código enviado! Verifique sua caixa de entrada.");
      },
      {
        errorFn: (error) => {
          return {
            title: "Erro ao enviar código",
            description: getErrorMessageOrDefault(
              error,
              "Tente novamente mais tarde"
            ),
          };
        },
        finallyFn: () => {
          setLoading(false);
        },
      }
    );
  };

  const resetRecoveryState = () => {
    setRecoveryStep("email");
    setEmail("");
    setOtpDigits(["", "", "", "", "", ""]);
    setNewPassword("");
    setConfirmNewPassword("");
    setError("");
    setSuccess("");

    setFormView("login");
  };

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const code = otpDigits.join("");

    if (code.length !== 6) {
      setError("Insira o código completo");
      setLoading(false);
      return;
    }
    if (!newPwStrong) {
      setError("A senha não atende os requisitos");
      setLoading(false);
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("As senhas não coincidem");
      setLoading(false);
      return;
    }

    try {
      await httpClient.post<IApiEnvelope<{ success?: boolean }>>(
        "/api/v1/account/password-recovery/verify",
        {
          email,
          code,
          new_password: newPassword,
        }
      );
    } catch (err: unknown) {
      const msg =
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data &&
        typeof (err.response.data as { message: unknown }).message === "string"
          ? (err.response.data as { message: string }).message
          : "Erro ao verificar código";
      setError(msg);
      setLoading(false);
      return;
    }

    setSuccess("Senha atualizada com sucesso! Redirecionando...");
    setLoading(false);
    setTimeout(() => {
      resetRecoveryState();
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    setLoading(true);

    try {
      switch (recoveryStep) {
        case "email":
          await handleSendCode(e);
          break;
        case "code":
        case "newPassword":
          await handleVerifyAndReset(e);
          break;
      }
    } catch (error) {
      console.error(error);
      const title =
        recoveryStep === "newPassword"
          ? "Erro ao atualizar senha"
          : recoveryStep === "email"
          ? "Erro ao enviar código"
          : "Erro na recuperação de senha";
      toast({
        title,
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      prev?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();

    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);

    if (text.length === 6) {
      setOtpDigits(text.split(""));
      const last = document.getElementById("otp-5");
      last?.focus();
    }
  };

  const renderRecoveryContent = () => {
    if (recoveryStep === "email") {
      return (
        <>
          <div className="mb-8">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Mail className="text-primary" size={22} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Recuperar senha
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Informe seu email para receber um código de 6 dígitos
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="px-4 py-3 rounded-xl bg-destructive/5 border border-destructive/15 text-destructive text-[13px] font-medium flex items-start gap-2.5 animate-fade-in">
                <div className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <X size={10} />
                </div>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="px-4 py-3 rounded-xl bg-primary/5 border border-primary/15 text-primary text-[13px] font-medium flex items-start gap-2.5 animate-fade-in">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={10} />
                </div>
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
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40"
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
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 flex items-center justify-center gap-2 mt-2 shadow-lg shadow-primary/20"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  Enviar código <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </>
      );
    }

    if (recoveryStep === "code") {
      const code = otpDigits.join("");
      return (
        <>
          <div className="mb-8">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <KeyRound className="text-primary" size={22} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Insira o código
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Enviamos um código de 6 dígitos para{" "}
              <span className="font-semibold text-foreground">{email}</span>
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (code.length === 6) setRecoveryStep("newPassword");
              else setError("Insira o código completo");
            }}
            className="space-y-6"
          >
            {error && (
              <div className="px-4 py-3 rounded-xl bg-destructive/5 border border-destructive/15 text-destructive text-[13px] font-medium flex items-start gap-2.5 animate-fade-in">
                <div className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <X size={10} />
                </div>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="px-4 py-3 rounded-xl bg-primary/5 border border-primary/15 text-primary text-[13px] font-medium flex items-start gap-2.5 animate-fade-in">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={10} />
                </div>
                <span>{success}</span>
              </div>
            )}
            <div
              className="flex justify-center gap-2.5"
              onPaste={handleOtpPaste}
            >
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 border-border/60 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200"
                  autoFocus={i === 0}
                />
              ))}
            </div>
            <button
              type="submit"
              disabled={code.length !== 6}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              Continuar <ArrowRight size={16} />
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={handleSendCode}
                className="text-xs text-primary/80 hover:text-primary font-medium transition-colors"
              >
                Reenviar código
              </button>
            </div>
          </form>
        </>
      );
    }

    // newPassword step
    return (
      <>
        <div className="mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Lock className="text-primary" size={22} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Nova senha
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Escolha uma nova senha segura para sua conta
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-destructive/5 border border-destructive/15 text-destructive text-[13px] font-medium flex items-start gap-2.5 animate-fade-in">
              <div className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <X size={10} />
              </div>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="px-4 py-3 rounded-xl bg-primary/5 border border-primary/15 text-primary text-[13px] font-medium flex items-start gap-2.5 animate-fade-in">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check size={10} />
              </div>
              <span>{success}</span>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Nova senha
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40"
              />
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className={inputClass + " pr-11"}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {newPassword && (
              <div className="mt-3 space-y-2">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                        i < newPwScore ? newPwStrengthColor : "bg-border/40"
                      }`}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {newPwChecks.map((c) => (
                    <p
                      key={c.label}
                      className={`text-[11px] flex items-center gap-1.5 transition-colors ${
                        c.ok
                          ? "text-primary font-medium"
                          : "text-muted-foreground/40"
                      }`}
                    >
                      {c.ok ? <Check size={10} /> : <X size={10} />} {c.label}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Confirmar nova senha
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40"
              />
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                minLength={8}
                className={inputClass}
                placeholder="••••••••"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 flex items-center justify-center gap-2 mt-2 shadow-lg shadow-primary/20"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>
                Atualizar senha <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </>
    );
  };

  return (
    <>
      {renderRecoveryContent()}
      <div className="text-center mt-8">
        <button
          onClick={resetRecoveryState}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 mx-auto"
        >
          <ArrowLeft size={14} />
          Voltar ao login
        </button>
      </div>
    </>
  );
}
