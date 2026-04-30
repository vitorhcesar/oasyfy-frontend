import { AppError } from "@/domain/errors/app.error";
import { PasswordStrengthHelper } from "@/http/helper/password-strength.helper";
import { getErrorMessageOrDefault } from "@/http/utils/get-error-message-or-default";
import { translateError } from "@/http/utils/translate-error";
import { tryOrToastError } from "@/http/utils/try-or-toast-error";
import { phoneValidationSchema } from "@/http/validation/schemas/phone-validation.schema";
import { authClient } from "@/infra/auth";
import { IApiEnvelope, httpClient } from "@/infra/http";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  User,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import z from "zod";

const passwordStrengthHelper = new PasswordStrengthHelper();

const emailValidationSchema = z.string().email("Insira um email válido");

interface ISignUpFormProps {
  inputClass: string;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  openSignupVerification: () => Promise<void>;
  setView: (view: "login" | "signup") => void;
}

export default function SignUpForm({
  inputClass,
  email,
  setEmail,
  password,
  setPassword,
  openSignupVerification,
  setView,
}: ISignUpFormProps) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loading, setLoading] = useState(false);

  const passwordScore = useMemo(
    () => passwordStrengthHelper.getPasswordScore(password),
    [password]
  );
  const strengthColor = useMemo(
    () => passwordStrengthHelper.getStrengthColor(password),
    [password]
  );
  const strengthLabel = useMemo(
    () => passwordStrengthHelper.getStrengthLabel(password),
    [password]
  );
  const passwordChecks = useMemo(
    () => passwordStrengthHelper.getPasswordChecks(password),
    [password]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const schema = z.object({
      email: emailValidationSchema,
      phone: phoneValidationSchema,
    });

    const result = schema.safeParse({ email, phone });
    if (!result.success) {
      setError(getErrorMessageOrDefault(result.error, "Dados inválidos"));
      return;
    }

    const passwordStrong =
      passwordStrengthHelper.checkPasswordIsStrong(password);

    if (!passwordStrong) {
      setError("Sua senha não atende todos os requisitos de segurança");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      setLoading(false);
      return;
    }

    setLoading(true);

    tryOrToastError(
      async () => {
        const rl = await httpClient.post<
          IApiEnvelope<{ allowed?: boolean; message?: string }>
        >("/api/v1/rate-limit/check", { action: "signup" });

        if (rl.data.allowed === false) {
          throw new AppError(
            rl.data.message || "Muitas tentativas. Tente novamente mais tarde.",
            429
          );
        }

        const signUpResult = await authClient.signUp.email({
          email,
          password,
          name: fullName,
        });

        if (signUpResult.error) {
          throw new AppError(
            translateError(
              signUpResult.error.message ?? "Erro desconhecido ao cadastrar"
            ),
            400
          );
        }

        await authClient.signOut();
        await openSignupVerification();
      },
      {
        errorFn: (error) => {
          return {
            title: "Erro ao cadastrar",
            description: getErrorMessageOrDefault(error, "Erro ao cadastrar"),
          };
        },
        finallyFn: () => {
          setLoading(false);
        },
      }
    );
  };

  const handleGoToLogin = () => {
    setView("login");
    setError("");
    setSuccess("");
    setEmail("");
    setPassword("");
    setFullName("");
    setPhone("");
    setConfirmPassword("");
  };

  return (
    <>
      <div className="mb-7">
        <h1 className="text-xl font-semibold text-foreground">
          Crie sua conta
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Preencha seus dados para começar
        </p>
      </div>

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
            Nome completo
          </label>
          <div className="relative">
            <User
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50"
            />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className={inputClass}
              placeholder="João Silva"
            />
          </div>
        </div>

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
          {email && !emailValidationSchema.safeParse(email).success && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-1.5 pl-1">
              <X size={11} /> Email inválido
            </p>
          )}
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Telefone
          </label>
          <div className="relative">
            <Phone
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50"
            />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className={inputClass}
              placeholder="(11) 99999-9999"
            />
          </div>
          {phone && !phoneValidationSchema.safeParse(phone).success && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-1.5 pl-1">
              <X size={11} /> Telefone inválido
            </p>
          )}
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

          {password && (
            <div className="mt-3 space-y-2">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      i < passwordScore ? strengthColor : "bg-border"
                    }`}
                  />
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Força:{" "}
                <span className="font-medium text-foreground">
                  {strengthLabel}
                </span>
              </p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                {passwordChecks.map((c) => (
                  <p
                    key={c.label}
                    className={`text-[11px] flex items-center gap-1 ${
                      c.ok ? "text-primary" : "text-muted-foreground/40"
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
            Confirmar senha
          </label>
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50"
            />
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
          className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-[0.99] transition-all disabled:opacity-40 flex items-center justify-center gap-2 mt-1"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <>
              Criar conta <ArrowRight size={15} />
            </>
          )}
        </button>
      </form>

      <div className="text-center mt-6">
        <button
          onClick={handleGoToLogin}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Já tem conta? <span className="text-primary font-medium">Entrar</span>
        </button>
      </div>
    </>
  );
}
